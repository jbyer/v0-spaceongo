import { NextResponse, type NextRequest } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { BookingConfirmationEmail } from "@/components/emails/booking-confirmation-email"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 })
    }

    // Use service role client for full access
    const supabaseAdmin = createServiceClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Fetch complete booking details with space and user information
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select(`
        *,
        spaces (
          title,
          description,
          space_type,
          address_line1,
          address_line2,
          city,
          state,
          zip_code,
          capacity,
          amenities,
          profiles:host_id (
            first_name,
            last_name,
            display_name
          )
        ),
        profiles:guest_id (
          first_name,
          last_name,
          display_name,
          email
        )
      `)
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      console.error("[v0] Failed to fetch booking:", bookingError)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const space = booking.spaces as any
    const guest = booking.profiles as any
    const host = space?.profiles as any

    if (!guest?.email) {
      console.error("[v0] Guest email not found")
      return NextResponse.json({ error: "Guest email not found" }, { status: 400 })
    }

    // Format booking date
    const startDate = new Date(booking.start_date)
    const endDate = new Date(booking.end_date)
    
    // Determine booking duration type and format
    const hours = booking.total_hours || 0
    let bookingDuration = ""
    let bookingDate = ""
    
    if (hours < 24) {
      // Hourly booking
      bookingDuration = `${hours} hour${hours !== 1 ? "s" : ""}`
      bookingDate = startDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })
    } else if (hours < 168) {
      // Daily booking (less than a week)
      const days = Math.ceil(hours / 24)
      bookingDuration = `${days} day${days !== 1 ? "s" : ""}`
      if (days === 1) {
        bookingDate = startDate.toLocaleDateString("en-US", { 
          weekday: "long", 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        })
      } else {
        bookingDate = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      }
    } else if (hours < 720) {
      // Weekly booking
      const weeks = Math.ceil(hours / 168)
      bookingDuration = `${weeks} week${weeks !== 1 ? "s" : ""}`
      bookingDate = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    } else {
      // Monthly booking
      const months = Math.ceil(hours / 720)
      bookingDuration = `${months} month${months !== 1 ? "s" : ""}`
      bookingDate = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    }

    // Extract time from dates if hourly booking
    let startTime: string | undefined
    let endTime: string | undefined
    if (hours < 24) {
      startTime = startDate.toTimeString().slice(0, 5) // "HH:MM"
      endTime = endDate.toTimeString().slice(0, 5)
    }

    // Generate confirmation number (use first 8 chars of booking ID)
    const confirmationNumber = booking.id.substring(0, 8).toUpperCase()

    // Get Resend client
    const resend = getResendClient()
    if (!resend) {
      console.error("[v0] Resend client not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Format amounts
    const totalAmount = (booking.total_amount || 0).toFixed(2)
    const serviceFee = (booking.service_fee || 0).toFixed(2)
    const taxAmount = (booking.tax_amount || 0).toFixed(2)
    const finalAmount = (booking.final_amount || 0).toFixed(2)

    // Prepare email data for both React component and Resend template
    const emailData = {
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
      fullAddress: `${space?.address_line1 || ""}, ${space?.city || ""}, ${space?.state || ""} ${space?.zip_code || ""}`,
      maxCapacity: space?.capacity,
      amenities: space?.amenities || [],
      amenitiesList: (space?.amenities || []).join(", "),
      description: space?.description,
      totalAmount,
      serviceFee,
      taxAmount,
      finalAmount,
      hostName: host?.display_name || host?.first_name || "Host",
      appName: EMAIL_CONFIG.appName,
      dashboardUrl: "https://www.spaceongo.com/dashboard/bookings",
    }

    // Check if a Resend template ID is configured
    const templateId = process.env.RESEND_BOOKING_CONFIRMATION_TEMPLATE_ID

    let sendResult
    
    if (templateId) {
      // Use Resend template from dashboard
      console.log("[v0] Using Resend booking confirmation template ID:", templateId)
      sendResult = await resend.emails.send({
        from: EMAIL_CONFIG.fromEmail,
        to: [guest.email],
        replyTo: EMAIL_CONFIG.replyTo,
        subject: `Booking Confirmation - ${space?.title || "Your Space"} | ${confirmationNumber}`,
        // @ts-ignore - Resend SDK types may not include template
        template: {
          id: templateId,
          variables: {
            // Guest info
            guest_name: emailData.guestName,
            guestName: emailData.guestName,
            
            // Confirmation
            confirmation_number: emailData.confirmationNumber,
            confirmationNumber: emailData.confirmationNumber,
            
            // Space details
            space_name: emailData.spaceName,
            spaceName: emailData.spaceName,
            space_type: emailData.spaceType,
            spaceType: emailData.spaceType,
            host_name: emailData.hostName,
            hostName: emailData.hostName,
            max_capacity: emailData.maxCapacity?.toString() || "",
            maxCapacity: emailData.maxCapacity?.toString() || "",
            
            // Booking details
            booking_date: emailData.bookingDate,
            bookingDate: emailData.bookingDate,
            booking_duration: emailData.bookingDuration,
            bookingDuration: emailData.bookingDuration,
            start_time: emailData.startTime || "",
            startTime: emailData.startTime || "",
            end_time: emailData.endTime || "",
            endTime: emailData.endTime || "",
            
            // Location
            address: emailData.address,
            city: emailData.city,
            state: emailData.state,
            zip_code: emailData.zipCode,
            zipCode: emailData.zipCode,
            full_address: emailData.fullAddress,
            fullAddress: emailData.fullAddress,
            
            // Amenities & Description
            amenities: emailData.amenitiesList,
            amenities_list: emailData.amenitiesList,
            description: emailData.description || "",
            
            // Payment
            total_amount: emailData.totalAmount,
            totalAmount: emailData.totalAmount,
            service_fee: emailData.serviceFee,
            serviceFee: emailData.serviceFee,
            tax_amount: emailData.taxAmount,
            taxAmount: emailData.taxAmount,
            final_amount: emailData.finalAmount,
            finalAmount: emailData.finalAmount,
            
            // App info
            app_name: emailData.appName,
            appName: emailData.appName,
            dashboard_url: emailData.dashboardUrl,
            dashboardUrl: emailData.dashboardUrl,
          },
        },
      })
    } else {
      // Use React component (fallback)
      console.log("[v0] Using React component for booking confirmation email")
      sendResult = await resend.emails.send({
        from: EMAIL_CONFIG.fromEmail,
        to: [guest.email],
        replyTo: EMAIL_CONFIG.replyTo,
        subject: `Booking Confirmation - ${space?.title || "Your Space"} | ${confirmationNumber}`,
        react: BookingConfirmationEmail({
          guestName: emailData.guestName,
          confirmationNumber: emailData.confirmationNumber,
          spaceName: emailData.spaceName,
          spaceType: emailData.spaceType,
          bookingDate: emailData.bookingDate,
          bookingDuration: emailData.bookingDuration,
          startTime: emailData.startTime,
          endTime: emailData.endTime,
          address: emailData.address,
          city: emailData.city,
          state: emailData.state,
          zipCode: emailData.zipCode,
          maxCapacity: emailData.maxCapacity,
          amenities: emailData.amenities,
          description: emailData.description,
          totalAmount: emailData.totalAmount,
          serviceFee: emailData.serviceFee,
          taxAmount: emailData.taxAmount,
          finalAmount: emailData.finalAmount,
          hostName: emailData.hostName,
          appName: emailData.appName,
        }),
      })
    }
    
    const { data: emailResponseData, error: emailError } = sendResult

    if (emailError) {
      console.error("[v0] Failed to send booking confirmation email:", emailError)
      return NextResponse.json({ error: "Failed to send email", details: emailError }, { status: 500 })
    }

    console.log("[v0] Booking confirmation email sent successfully:", emailResponseData?.id)

    return NextResponse.json({ 
      success: true, 
      emailId: emailResponseData?.id,
      confirmationNumber 
    })

  } catch (error) {
    console.error("[v0] Error sending booking confirmation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
