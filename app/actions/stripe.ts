"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function createBookingCheckoutSession(bookingData: {
  spaceId: string
  rentalType: "hourly" | "daily"
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
}) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("You must be logged in to book a space")
    }

    console.log("User authenticated for booking:", user.id)

    // Ensure profile exists for authenticated user (required for RLS policy: guest_id must equal auth.uid())
    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    
    // Check if profile exists for this user
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (!existingProfile) {
      // Profile doesn't exist, need to create it
      console.log("Creating profile for user:", user.id)

      // Try to create the profile with the user's ID
      const { error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          display_name: displayName,
          first_name: user.user_metadata?.given_name || "",
          last_name: user.user_metadata?.family_name || "",
        })

      if (createError) {
        // If it's a duplicate email error, a stale profile exists with this email
        if (createError.code === "23505" && createError.message.includes("email")) {
          console.warn("[v0] Duplicate email found, attempting to replace stale profile")
          
          // Find the stale profile by email
          const { data: staleProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", user.email)
            .neq("id", user.id)
            .maybeSingle()

          if (staleProfile) {
            console.log("[v0] Found stale profile:", staleProfile.id, "- attempting to delete")
            // Try to delete the stale profile
            const { error: deleteError } = await supabase
              .from("profiles")
              .delete()
              .eq("id", staleProfile.id)

            if (deleteError) {
              console.warn("[v0] Could not delete stale profile:", deleteError)
              // If we can't delete due to FK constraints, update it to have the new user's ID
              console.log("[v0] Attempting to reassign stale profile ID to current user")
              const { error: updateError } = await supabase
                .from("profiles")
                .update({ id: user.id, email: user.email })
                .eq("id", staleProfile.id)
              
              if (updateError) {
                console.error("[v0] Could not reassign stale profile:", updateError)
                throw new Error("Failed to resolve user profile conflict. Please try again.")
              }
            } else {
              // Stale profile deleted successfully, try to create new one
              console.log("[v0] Stale profile deleted, retrying profile creation")
              const { error: retryError } = await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  email: user.email,
                  display_name: displayName,
                  first_name: user.user_metadata?.given_name || "",
                  last_name: user.user_metadata?.family_name || "",
                })

              if (retryError) {
                console.error("[v0] Error creating profile after cleanup:", retryError)
                throw new Error("Failed to create user profile. Please try again.")
              }
            }
          }
        } else {
          console.error("[v0] Error creating profile:", createError)
          throw new Error("Failed to create user profile. Please try again.")
        }
      }
    }

    // Always use user.id for guest_id (required by RLS policy)
    const profileId = user.id
    console.log("[v0] Using profile ID for booking:", profileId)

    // Fetch space details
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id, title, host_id, price_per_hour, price_per_day")
      .eq("id", bookingData.spaceId)
      .single()

    if (spaceError || !space) {
      throw new Error("Space not found")
    }

    // Calculate price and duration based on rental type
    let totalHours = 0
    let baseAmount = 0
    let description = ""

    if (bookingData.rentalType === "hourly") {
      if (!space.price_per_hour) {
        throw new Error("Hourly pricing not available for this space")
      }
      // Calculate hours between start and end time
      if (!bookingData.startTime || !bookingData.endTime) {
        throw new Error("Start time and end time are required for hourly bookings")
      }
      const [startHour, startMin] = bookingData.startTime.split(":").map(Number)
      const [endHour, endMin] = bookingData.endTime.split(":").map(Number)
      const hoursDecimal = endHour - startHour + (endMin - startMin) / 60
      // Round up to nearest hour for billing purposes
      totalHours = Math.ceil(hoursDecimal)
      baseAmount = space.price_per_hour * totalHours
      description = `${totalHours} hour${totalHours !== 1 ? "s" : ""} on ${new Date(bookingData.startDate).toLocaleDateString()}`
    } else {
      if (!space.price_per_day) {
        throw new Error("Daily pricing not available for this space")
      }
      // Calculate days between start and end date
      const start = new Date(bookingData.startDate)
      const end = new Date(bookingData.endDate || bookingData.startDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      totalHours = days * 24
      baseAmount = space.price_per_day * days
      description = `${days} day${days !== 1 ? "s" : ""} from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
    }

    const serviceFee = baseAmount * 0.03 // 3% service fee
    const taxAmount = baseAmount * 0.08 // 8% tax
    const finalAmount = baseAmount + serviceFee + taxAmount

    // Build proper ISO date strings with correct timezone handling
    // bookingData.startDate may be a full ISO string ("2026-02-10T05:00:00.000Z") or just a date ("2026-02-10")
    // bookingData.startTime is a time string like "14:00"
    // Extract just the YYYY-MM-DD portion to avoid invalid date concatenation
    const startDateOnly = bookingData.startDate.split("T")[0]
    const endDateOnly = (bookingData.endDate || bookingData.startDate).split("T")[0]

    let startDateTime: Date
    let endDateTime: Date

    if (bookingData.rentalType === "hourly" && bookingData.startTime && bookingData.endTime) {
      // For hourly bookings, combine date + time properly
      // Use "YYYY-MM-DDTHH:MM:00" format which is parsed as local time
      const startIso = `${startDateOnly}T${bookingData.startTime}:00`
      const endIso = `${startDateOnly}T${bookingData.endTime}:00`
      startDateTime = new Date(startIso)
      endDateTime = new Date(endIso)
    } else {
      // For daily bookings, set check-in at noon and check-out at noon to avoid timezone date shifts
      startDateTime = new Date(`${startDateOnly}T12:00:00`)
      endDateTime = new Date(`${endDateOnly}T12:00:00`)
    }

    // Do NOT create the booking yet - it will be created after  succeeds via webhook
    // Store booking details in Stripe metadata for the webhook to use
    console.log("[v0] Preparing booking metadata (not creating booking until  succeeds)")

    // Create Stripe checkout session WITHOUT creating a booking first
    const totalAmountCents = Math.round(finalAmount * 100) // Convert to cents

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.spaceongo.com"

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      redirect_on_completion: "if_required",
      return_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: space.title,
              description: description,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "",
      automatic__methods: { enabled: true },
      metadata: {
        guestId: profileId,
        spaceId: space.id,
        hostId: space.host_id,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        totalHours: totalHours.toString(),
        pricePerHour: (space.price_per_hour || space.price_per_day! / 24).toString(),
        totalAmount: baseAmount.toString(),
        serviceFee: serviceFee.toString(),
        taxAmount: taxAmount.toString(),
        finalAmount: finalAmount.toString(),
        rentalType: bookingData.rentalType,
        guestCount: "1",
      },
    })

    if (!session.client_secret) {
      console.error("[v0] Stripe session created but no client_secret returned")
      throw new Error("Failed to create Stripe session. Please try again.")
    }

    console.log("[v0] Stripe session created successfully:", session.id)

    return { clientSecret: session.client_secret, sessionId: session.id }
  } catch (error) {
    console.error("[v0] Error in createBookingCheckoutSession:", error)
    throw error
  }
}
