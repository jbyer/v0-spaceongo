import { createClient } from "@/lib/supabase/client"

export interface AvailabilitySlot {
  id?: string
  space_id: string
  start_date: string // ISO date string
  end_date: string // ISO date string
  start_time?: string // HH:MM:SS format
  end_time?: string // HH:MM:SS format
  availability_status: "available" | "unavailable" | "blocked"
  recurrence_type?: "none" | "daily" | "weekly" | "monthly"
  recurrence_end_date?: string
  notes?: string
}

/**
 * Insert or update availability slots for a space
 * Handles both single and bulk operations
 */
export async function upsertSpaceAvailability(spaceId: string, availabilitySlots: AvailabilitySlot[]) {
  const supabase = createClient()

  try {
    // Use the PostgreSQL function for bulk upsert
    const { data, error } = await supabase.rpc("upsert_space_availability", {
      p_space_id: spaceId,
      p_availability_data: availabilitySlots,
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error upserting availability:", error)
    return { success: false, error }
  }
}

/**
 * Get all availability slots for a space
 */
export async function getSpaceAvailability(spaceId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("space_availability")
      .select("*")
      .eq("space_id", spaceId)
      .order("start_date", { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching availability:", error)
    return { success: false, error }
  }
}

/**
 * Check if a space is available for a specific date range
 */
export async function checkSpaceAvailability(
  spaceId: string,
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string,
) {
  const supabase = createClient()

  try {
    const query = supabase
      .from("space_availability")
      .select("*")
      .eq("space_id", spaceId)
      .eq("availability_status", "unavailable")
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

    const { data, error } = await query

    if (error) throw error

    // If there are any unavailable slots in the date range, the space is not available
    const isAvailable = !data || data.length === 0

    return { success: true, isAvailable, conflicts: data }
  } catch (error) {
    console.error("Error checking availability:", error)
    return { success: false, error }
  }
}

/**
 * Delete availability slots
 */
export async function deleteAvailabilitySlots(slotIds: string[]) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("space_availability").delete().in("id", slotIds)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Error deleting availability:", error)
    return { success: false, error }
  }
}
