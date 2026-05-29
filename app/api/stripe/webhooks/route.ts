import { type NextRequest, NextResponse } from "next/server"
import { stripe, WEBHOOK_CONFIG } from "@/lib/stripe/config"
import { createClient } from "@/lib/supabase/server"
import type Stripe from "stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_CONFIG.endpointSecret)
  } catch (error) {
    console.error("[v0] Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log("[v0] Webhook received:", event.type)

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(supabase, paymentIntent)
        break

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailure(supabase, failedPayment)
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(supabase, subscription)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(supabase, deletedSubscription)
        break

      default:
        console.log(`[v0] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  console.log("[v0] Handling checkout completion for session:", session.id)

  const metadata = session.metadata || {}
  const { 
    guestId, 
    spaceId, 
    hostId, 
    startDate, 
    endDate, 
    totalHours, 
    pricePerHour, 
    totalAmount, 
    serviceFee, 
    taxAmount, 
    finalAmount,
    guestCount
  } = metadata

  if (!guestId || !spaceId) {
    console.error("[v0] Missing required metadata (guestId or spaceId) in session:", session.id)
    return
  }

  console.log("[v0] Creating booking from session metadata for guest:", guestId)

  // CREATE the booking now that payment has succeeded
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      space_id: spaceId,
      guest_id: guestId,
      host_id: hostId,
      start_date: startDate,
      end_date: endDate,
      total_hours: parseInt(totalHours || "0"),
      price_per_hour: parseFloat(pricePerHour || "0"),
      total_amount: parseFloat(totalAmount || "0"),
      service_fee: parseFloat(serviceFee || "0"),
      tax_amount: parseFloat(taxAmount || "0"),
      final_amount: parseFloat(finalAmount || "0"),
      status: "confirmed",
      payment_status: "paid",
      payment_intent_id: session.payment_intent as string,
      guest_count: parseInt(guestCount || "1"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (bookingError || !booking) {
    console.error("[v0] Failed to create booking:", bookingError)
    throw bookingError
  }

  console.log("[v0] Booking created successfully:", booking.id)

  // Create payment record
  const { error: paymentError } = await supabase.from("payments").insert({
    user_id: guestId,
    booking_id: booking.id,
    space_id: spaceId,
    stripe_payment_intent_id: session.payment_intent as string,
    amount: session.amount_total! / 100, // Convert from cents
    currency: session.currency,
    status: "succeeded",
    payment_method: "card",
    created_at: new Date().toISOString(),
  })

  if (paymentError) {
    console.error("[v0] Failed to create payment record:", paymentError)
  } else {
    console.log("[v0] Payment record created")
  }

  // Create notification for guest
  await supabase.from("notifications").insert({
    user_id: guestId,
    title: "Booking Confirmed",
    message: "Your booking payment has been processed successfully.",
    type: "booking",
    action_url: `/dashboard/bookings`,
    created_at: new Date().toISOString(),
  })

  console.log("[v0] Notification sent to guest")

  // Send booking confirmation email via Resend (inline to avoid self-referencing fetch)
  try {
    const { getResendClient, EMAIL_CONFIG } = await import("@/lib/resend")
    const { BookingConfirmationEmail } = await import("@/components/emails/booking-confirmation-email")
    const { createClient: createServiceClient } = await import("@supabase/supabase-js")

    const supabaseEmail = createServiceClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: fullBooking } = await supabaseEmail
      .from("bookings")
      .select(`
        *,
        spaces (title, description, space_type, address_line1, city, state, zip_code, capacity, amenities,
          profiles:host_id (first_name, last_name, display_name)),
        profiles:guest_id (first_name, last_name, display_name, email)
      `)
      .eq("id", booking.id)
      .single()

    if (fullBooking) {
      const emailSpace = fullBooking.spaces as any
      const emailGuest = fullBooking.profiles as any
      const emailHost = emailSpace?.profiles as any

      if (emailGuest?.email) {
        const resend = getResendClient()
        if (resend) {
          const startDate = new Date(fullBooking.start_date)
          const endDate = new Date(fullBooking.end_date)
          const hours = fullBooking.total_hours || 0
          let bookingDuration = ""
          let bookingDate = ""

          if (hours < 24) {
            bookingDuration = `${hours} hour${hours !== 1 ? "s" : ""}`
            bookingDate = startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
          } else {
            const days = Math.ceil(hours / 24)
            bookingDuration = `${days} day${days !== 1 ? "s" : ""}`
            bookingDate = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
          }

          const confirmationNumber = fullBooking.id.substring(0, 8).toUpperCase()

          const { error: emailError } = await resend.emails.send({
            from: EMAIL_CONFIG.fromEmail,
            to: [emailGuest.email],
            replyTo: EMAIL_CONFIG.replyTo,
            subject: `Booking Confirmation - ${emailSpace?.title || "Your Space"} | ${confirmationNumber}`,
            react: BookingConfirmationEmail({
              guestName: emailGuest.first_name || emailGuest.display_name || "Guest",
              confirmationNumber,
              spaceName: emailSpace?.title || "Space",
              spaceType: emailSpace?.space_type || "Space",
              bookingDate,
              bookingDuration,
              address: emailSpace?.address_line1 || "",
              city: emailSpace?.city || "",
              state: emailSpace?.state || "",
              zipCode: emailSpace?.zip_code || "",
              maxCapacity: emailSpace?.capacity,
              amenities: emailSpace?.amenities || [],
              description: emailSpace?.description,
              totalAmount: (fullBooking.total_amount || 0).toFixed(2),
              serviceFee: (fullBooking.service_fee || 0).toFixed(2),
              taxAmount: (fullBooking.tax_amount || 0).toFixed(2),
              finalAmount: (fullBooking.final_amount || 0).toFixed(2),
              hostName: emailHost?.display_name || emailHost?.first_name || "Host",
              appName: EMAIL_CONFIG.appName,
            }),
          })

          if (!emailError) {
            console.log("[v0] Booking confirmation email sent successfully")
          } else {
            console.error("[v0] Failed to send booking confirmation email:", emailError)
          }
        }
      }
    }
  } catch (emailError) {
    console.error("[v0] Error sending booking confirmation email:", emailError)
    // Don't throw - email failure shouldn't fail the webhook
  }
}

async function handlePaymentSuccess(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log("[v0] Handling payment success:", paymentIntent.id)

  const { userId, bookingId, spaceId } = paymentIntent.metadata

  if (bookingId) {
    // Update booking status
    await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
  }

  // Create payment record
  await supabase.from("payments").insert({
    user_id: userId,
    booking_id: bookingId,
    space_id: spaceId,
    stripe_payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: "succeeded",
    created_at: new Date().toISOString(),
  })

  console.log("[v0] Payment recorded")
}

async function handlePaymentFailure(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log("[v0] Handling payment failure:", paymentIntent.id)

  const { userId, bookingId } = paymentIntent.metadata

  if (bookingId) {
    await supabase
      .from("bookings")
      .update({
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
  }

  // Create payment record
  await supabase.from("payments").insert({
    user_id: userId,
    booking_id: bookingId,
    stripe_payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: "failed",
    created_at: new Date().toISOString(),
  })

  console.log("[v0] Failed payment recorded")
}

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: profile } = await supabase.from("profiles").select("id").eq("stripe_customer_id", customerId).single()

  if (profile) {
    await supabase.from("subscriptions").upsert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
}

async function handleSubscriptionCancellation(supabase: any, subscription: Stripe.Subscription) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
}
