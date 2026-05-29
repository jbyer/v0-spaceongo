import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * API endpoint to update booking statuses based on current date/time
 * This should be called by a cron job daily or via manual trigger
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check for authorization (optional: add API key check for cron security)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[v0] Starting booking status update job...")

  const now = new Date().toISOString()
  let updatedCount = 0

  try {
    // 1. Update confirmed bookings that have ended to "completed"
    const { data: expiredBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("id, space_id, guest_id, host_id, end_date")
      .in("status", ["confirmed", "pending"])
      .lt("end_date", now)

    if (fetchError) {
      console.error("[v0] Error fetching expired bookings:", fetchError)
      throw fetchError
    }

    console.log(`[v0] Found ${expiredBookings?.length || 0} bookings that have ended`)

    if (expiredBookings && expiredBookings.length > 0) {
      // Update each booking to completed
      for (const booking of expiredBookings) {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            status: "completed",
            updated_at: now,
          })
          .eq("id", booking.id)

        if (updateError) {
          console.error(`[v0] Failed to update booking ${booking.id}:`, updateError)
        } else {
          console.log(`[v0] Updated booking ${booking.id} to completed`)
          updatedCount++

          // Create notification for guest
          await supabase.from("notifications").insert({
            user_id: booking.guest_id,
            title: "Booking Completed",
            message: "Your booking has ended. Please leave a review!",
            type: "booking",
            action_url: `/dashboard/bookings`,
            created_at: now,
          })

          // Create notification for host
          await supabase.from("notifications").insert({
            user_id: booking.host_id,
            title: "Booking Completed",
            message: "A booking at your space has been completed.",
            type: "booking",
            action_url: `/dashboard/host/bookings`,
            created_at: now,
          })
        }
      }
    }

    // 2. Cancel pending bookings where start_date has passed (unpaid bookings)
    const { data: unpaidBookings, error: unpaidError } = await supabase
      .from("bookings")
      .select("id, guest_id, start_date")
      .eq("status", "pending")
      .eq("payment_status", "pending")
      .lt("start_date", now)

    if (unpaidError) {
      console.error("[v0] Error fetching unpaid bookings:", unpaidError)
    } else if (unpaidBookings && unpaidBookings.length > 0) {
      console.log(`[v0] Found ${unpaidBookings.length} unpaid bookings that have expired`)

      for (const booking of unpaidBookings) {
        const { error: cancelError } = await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancellation_reason: "Payment not completed before booking start time",
            cancelled_at: now,
            updated_at: now,
          })
          .eq("id", booking.id)

        if (cancelError) {
          console.error(`[v0] Failed to cancel booking ${booking.id}:`, cancelError)
        } else {
          console.log(`[v0] Cancelled unpaid booking ${booking.id}`)
          updatedCount++

          // Notify guest
          await supabase.from("notifications").insert({
            user_id: booking.guest_id,
            title: "Booking Cancelled",
            message: "Your booking was cancelled due to incomplete payment.",
            type: "booking",
            action_url: `/dashboard/bookings`,
            created_at: now,
          })
        }
      }
    }

    console.log(`[v0] Booking status update complete. Updated ${updatedCount} bookings.`)

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} booking statuses`,
    })
  } catch (error) {
    console.error("[v0] Booking status update job failed:", error)
    return NextResponse.json(
      {
        error: "Failed to update booking statuses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Allow GET requests to manually trigger the job (for testing)
export async function GET(request: NextRequest) {
  return POST(request)
}
