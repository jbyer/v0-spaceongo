"use server"

import { createClient } from "@/lib/supabase/server"

export async function fetchHostBookings() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      spaces (
        id,
        title,
        address_line1,
        city,
        state,
        images
      ),
      profiles:guest_id (
        first_name,
        last_name,
        display_name,
        profile_image_url
      )
    `)
    .eq("host_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function checkSpaceAvailability(params: {
  spaceId: string
  rentalType: "hourly" | "daily"
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
}) {
  const supabase = await createClient()

  try {
    // Fetch space details including availability schedule
    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id, availability_schedule, is_active")
      .eq("id", params.spaceId)
      .single()

    if (spaceError || !space) {
      return {
        available: false,
        reason: "Space not found",
      }
    }

    if (!space.is_active) {
      return {
        available: false,
        reason: "This space is currently unavailable",
      }
    }

    // Parse dates
    const startDateTime = new Date(params.startDate)
    let endDateTime: Date

    if (params.rentalType === "hourly") {
      // For hourly bookings, combine date and time
      const [startHour, startMinute] = (params.startTime || "09:00").split(":").map(Number)
      const [endHour, endMinute] = (params.endTime || "17:00").split(":").map(Number)

      startDateTime.setHours(startHour, startMinute, 0, 0)
      endDateTime = new Date(params.startDate)
      endDateTime.setHours(endHour, endMinute, 0, 0)
    } else {
      // For daily bookings
      endDateTime = params.endDate ? new Date(params.endDate) : new Date(params.startDate)
      endDateTime.setHours(23, 59, 59, 999)
    }

    // Check for overlapping bookings
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, status")
      .eq("space_id", params.spaceId)
      .in("status", ["pending", "confirmed"])
      .or(`and(start_date.lte.${endDateTime.toISOString()},end_date.gte.${startDateTime.toISOString()})`)

    if (bookingsError) {
      console.error("[v0] Error checking bookings:", bookingsError)
      return {
        available: false,
        reason: "Unable to check availability. Please try again.",
      }
    }

    if (existingBookings && existingBookings.length > 0) {
      return {
        available: false,
        reason: "This space is already booked for the selected time period",
      }
    }

    // Check availability schedule (blocked dates/times)
    if (space.availability_schedule) {
      const schedule = space.availability_schedule as any

      // Check for unavailable dates
      if (schedule.unavailableDates && Array.isArray(schedule.unavailableDates)) {
        const requestedDate = startDateTime.toISOString().split("T")[0]
        const isBlocked = schedule.unavailableDates.some((blocked: any) => {
          if (blocked.type === "specific" && blocked.date === requestedDate) {
            return true
          }
          return false
        })

        if (isBlocked) {
          return {
            available: false,
            reason: "The host has blocked this date",
          }
        }
      }

      // Check for recurring unavailable days
      if (schedule.unavailableDates && Array.isArray(schedule.unavailableDates)) {
        const dayOfWeek = startDateTime.getDay()
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        const requestedDay = dayNames[dayOfWeek]

        const isRecurringBlocked = schedule.unavailableDates.some((blocked: any) => {
          if (blocked.type === "recurring" && blocked.day === requestedDay) {
            // Check if time falls within blocked time range
            if (params.rentalType === "hourly" && blocked.startTime && blocked.endTime) {
              const requestStartTime = params.startTime || "09:00"
              const requestEndTime = params.endTime || "17:00"

              // Simple time overlap check
              if (requestStartTime < blocked.endTime && requestEndTime > blocked.startTime) {
                return true
              }
            } else if (params.rentalType === "daily") {
              return true
            }
          }
          return false
        })

        if (isRecurringBlocked) {
          return {
            available: false,
            reason: "The host is not available on this day",
          }
        }
      }
    }

    // If all checks pass, space is available
    return {
      available: true,
      reason: null,
    }
  } catch (error) {
    console.error("[v0] Error in checkSpaceAvailability:", error)
    return {
      available: false,
      reason: "An error occurred while checking availability",
    }
  }
}
