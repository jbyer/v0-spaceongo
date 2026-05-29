import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type Booking = Database["public"]["Tables"]["bookings"]["Row"]
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"]
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"]

export async function createBooking(bookingData: Omit<BookingInsert, "guest_id">) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      ...bookingData,
      guest_id: user.id,
    })
    .select(`
      *,
      spaces (
        title,
        address_line1,
        city,
        state
      ),
      profiles:host_id (
        first_name,
        last_name,
        display_name,
        email
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function getUserBookings(userId?: string) {
  const supabase = await createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")
    targetUserId = user.id
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
      profiles:host_id (
        first_name,
        last_name,
        display_name,
        profile_image_url
      )
    `)
    .eq("guest_id", targetUserId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getHostBookings(hostId?: string) {
  const supabase = await createClient()

  let targetHostId = hostId
  if (!targetHostId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")
    targetHostId = user.id
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
    .eq("host_id", targetHostId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function updateBookingStatus(bookingId: string, status: string, cancellationReason?: string) {
  const supabase = await createClient()

  const updates: BookingUpdate = {
    status: status as any,
    updated_at: new Date().toISOString(),
  }

  if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString()
    updates.cancellation_reason = cancellationReason

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      updates.cancelled_by = user.id
    }
  }

  const { data, error } = await supabase.from("bookings").update(updates).eq("id", bookingId).select().single()

  if (error) throw error
  return data
}

export async function getBookingById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      *,
      spaces (
        *,
        profiles:host_id (
          first_name,
          last_name,
          display_name,
          profile_image_url,
          email,
          phone
        )
      ),
      profiles:guest_id (
        first_name,
        last_name,
        display_name,
        profile_image_url,
        email,
        phone
      )
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

// Client-side booking functions
export function useBookings() {
  const supabase = createBrowserClient()

  return {
    async checkAvailability(spaceId: string, startDate: string, endDate: string) {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, start_date, end_date")
        .eq("space_id", spaceId)
        .in("status", ["confirmed", "pending"])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      if (error) throw error
      return data.length === 0 // true if available
    },

    async calculateBookingCost(spaceId: string, startDate: string, endDate: string) {
      const { data: space, error } = await supabase
        .from("spaces")
        .select("price_per_hour, price_per_day")
        .eq("id", spaceId)
        .single()

      if (error) throw error

      const start = new Date(startDate)
      const end = new Date(endDate)
      const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))

      const hourlyRate = space.price_per_hour || 0
      const dailyRate = space.price_per_day || 0

      // Use daily rate if booking is 8+ hours and daily rate is better
      const useDaily = hours >= 8 && dailyRate > 0 && dailyRate < hourlyRate * 8

      let baseAmount: number
      if (useDaily) {
        const days = Math.ceil(hours / 24)
        baseAmount = days * dailyRate
      } else {
        baseAmount = hours * hourlyRate
      }

      const serviceFee = baseAmount * 0.03 // 3% service fee
      const taxAmount = baseAmount * 0.08 // 8% tax (adjust based on location)
      const totalAmount = baseAmount + serviceFee + taxAmount

      return {
        hours,
        baseAmount,
        serviceFee,
        taxAmount,
        totalAmount,
        priceType: useDaily ? "daily" : "hourly",
      }
    },
  }
}
