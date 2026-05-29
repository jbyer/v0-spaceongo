import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type UserActivity = Database["public"]["Tables"]["user_activities"]["Row"]
type UserActivityInsert = Database["public"]["Tables"]["user_activities"]["Insert"]

/**
 * Log a user activity to the database
 * This function should be called from server-side code (Server Actions or API Routes)
 */
export async function logUserActivity(
  userId: string,
  activityType: string,
  activityDescription: string,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  try {
    const supabase = createClient()

    // Get user's username for denormalization
    const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).single()

    const { data, error } = await supabase
      .from("user_activities")
      .insert({
        user_id: userId,
        username: profile?.username || null,
        activity_type: activityType,
        activity_description: activityDescription,
        metadata: metadata || {},
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error logging activity:", error)
      return { success: false, error: error.message }
    }

    return { success: true, activityId: data.id }
  } catch (error) {
    console.error("Error logging activity:", error)
    return { success: false, error: "Failed to log activity" }
  }
}

/**
 * Get user activities with pagination
 */
export async function getUserActivities(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ activities: UserActivity[]; total: number; error?: string }> {
  try {
    const supabase = createClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Get total count
    const { count } = await supabase
      .from("user_activities")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Get activities
    const { data, error } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching activities:", error)
      return { activities: [], total: 0, error: error.message }
    }

    return { activities: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error fetching activities:", error)
    return { activities: [], total: 0, error: "Failed to fetch activities" }
  }
}

/**
 * Get recent activities for dashboard display
 */
export async function getRecentActivities(
  userId: string,
  limit = 10,
): Promise<{ activities: UserActivity[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent activities:", error)
      return { activities: [], error: error.message }
    }

    return { activities: data || [] }
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return { activities: [], error: "Failed to fetch recent activities" }
  }
}

/**
 * Get activity summary for a user
 */
export async function getUserActivitySummary(
  userId: string,
  days = 30,
): Promise<{
  summary: Array<{ activity_type: string; activity_count: number; last_activity: string }>
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.rpc("get_user_activity_summary", {
      p_user_id: userId,
      p_days: days,
    })

    if (error) {
      console.error("Error fetching activity summary:", error)
      return { summary: [], error: error.message }
    }

    return { summary: data || [] }
  } catch (error) {
    console.error("Error fetching activity summary:", error)
    return { summary: [], error: "Failed to fetch activity summary" }
  }
}

/**
 * Get all activities (admin only)
 */
export async function getAllActivities(
  page = 1,
  pageSize = 50,
  filters?: {
    activityType?: string
    userId?: string
    startDate?: string
    endDate?: string
  },
): Promise<{ activities: UserActivity[]; total: number; error?: string }> {
  try {
    const supabase = createClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from("user_activities").select("*", { count: "exact" })

    // Apply filters
    if (filters?.activityType) {
      query = query.eq("activity_type", filters.activityType)
    }
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId)
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate)
    }

    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to)

    if (error) {
      console.error("Error fetching all activities:", error)
      return { activities: [], total: 0, error: error.message }
    }

    return { activities: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error fetching all activities:", error)
    return { activities: [], total: 0, error: "Failed to fetch activities" }
  }
}
