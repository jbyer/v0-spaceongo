import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { BookingConfirmationEmail } from "@/components/emails/booking-confirmation-email"

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    const { bookingId, guestId, spaceId } = session.metadata || {}

    if (!bookingId) {
      return NextResponse.json({ error: "No booking ID found in session" }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Check if booking is already confirmed (idempotent)
    const { data: existingBooking } = await supabaseAdmin
      .from("bookings")
      .select("status, payment_status")
      .eq("id", bookingId)
      .single()

    if (existingBooking?.status === "confirmed" && existingBooking?.payment_status === "paid") {
      // Already confirmed, return success without re-sending email
      return NextResponse.json({ success: true, alreadyConfirmed: true, emailSent: false })
    }

    // Update booking status to confirmed
    const { error: bookingError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    if (bookingError) {
      console.error("Failed to update booking:", bookingError)
      return NextResponse.json({ error: "Failed to confirm booking" }, { status: 500 })
    }

    // Create payment record (check for existing first)
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("stripe_payment_intent_id", session.payment_intent as string)
      .maybeSingle()

    if (!existingPayment) {
      await supabaseAdmin.from("payments").insert({
        user_id: guestId,
        booking_id: bookingId,
        space_id: spaceId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total! / 100,
        currency: session.currency,
        status: "succeeded",
        payment_method: "card",
        created_at: new Date().toISOString(),
      })
    }

    // Create notification for guest
    if (guestId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: guestId,
        title: "Booking Confirmed",
        message: "Your booking payment has been processed successfully.",
        type: "booking",
        action_url: "/dashboard/bookings",
        created_at: new Date().toISOString(),
      })
    }

    // Send booking confirmation email
    let emailSent = false
    try {
      // Fetch complete booking details
      const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select(`
          *,
          spaces (
            title, description, space_type, address_line1, address_line2,
            city, state, zip_code, capacity, amenities,
            profiles:host_id (first_name, last_name, display_name)
          ),
          profiles:guest_id (first_name, last_name, display_name, email)
        `)
        .eq("id", bookingId)
        .single()

      if (booking) {
        const space = booking.spaces as any
        const guest = booking.profiles as any
        const host = space?.profiles as any

        if (guest?.email) {
          const resend = getResendClient()
          if (resend) {
            // Format booking details
            const startDate = new Date(booking.start_date)
            const endDate = new Date(booking.end_date)
            const hours = booking.total_hours || 0

            let bookingDuration = ""
            let bookingDate = ""

            if (hours < 24) {
              bookingDuration = `${hours} hour${hours !== 1 ? "s" : ""}`
              bookingDate = startDate.toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })
            } else if (hours < 168) {
              const days = Math.ceil(hours / 24)
              bookingDuration = `${days} day${days !== 1 ? "s" : ""}`
              bookingDate = days === 1
                ? startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                : `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            } else if (hours < 720) {
              const weeks = Math.ceil(hours / 168)
              bookingDuration = `${weeks} week${weeks !== 1 ? "s" : ""}`
              bookingDate = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            } else {
              const months = Math.ceil(hours / 720)
              bookingDuration = `${months} month${months !== 1 ? "s" : ""}`
              bookingDate = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            }

            let startTime: string | undefined
            let endTime: string | undefined
            if (hours < 24) {
              startTime = startDate.toTimeString().slice(0, 5)
              endTime = endDate.toTimeString().slice(0, 5)
            }

            const confirmationNumber = booking.id.substring(0, 8).toUpperCase()

            const { error: emailError } = await resend.emails.send({
              from: EMAIL_CONFIG.fromEmail,
              to: [guest.email],
              replyTo: EMAIL_CONFIG.replyTo,
              subject: `Booking Confirmation - ${space?.title || "Your Space"} | ${confirmationNumber}`,
              react: BookingConfirmationEmail({
                guestName: guest.first_name || guest.display_name || "Guest",
                confirmationNumber,
                spaceName: space?.title || "Space",
                spaceType: space?.space_type || "Space",
                bookingDate,
                bookingDuration,
                startTime,
                endTime,
                address: space?.address_line1 || "",
                city: space?.city || "",
                state: space?.state || "",
                zipCode: space?.zip_code || "",
                maxCapacity: space?.capacity,
                amenities: space?.amenities || [],
                description: space?.description,
                totalAmount: (booking.total_amount || 0).toFixed(2),
                serviceFee: (booking.service_fee || 0).toFixed(2),
                taxAmount: (booking.tax_amount || 0).toFixed(2),
                finalAmount: (booking.final_amount || 0).toFixed(2),
                hostName: host?.display_name || host?.first_name || "Host",
                appName: EMAIL_CONFIG.appName,
              }),
            })

            if (!emailError) {
              emailSent = true
            } else {
              console.error("Failed to send booking confirmation email:", emailError)
            }
          }
        }
      }
    } catch (emailErr) {
      console.error("Error sending booking confirmation email:", emailErr)
    }

    return NextResponse.json({ success: true, emailSent })
  } catch (error) {
    console.error("Booking confirm error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
