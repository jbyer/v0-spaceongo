import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type Review = Database["public"]["Tables"]["reviews"]["Row"]
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"]

export async function createReview(reviewData: Omit<ReviewInsert, "reviewer_id">) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      ...reviewData,
      reviewer_id: user.id,
    })
    .select(`
      *,
      profiles:reviewer_id (
        first_name,
        last_name,
        display_name,
        profile_image_url
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function getSpaceReviews(spaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      profiles:reviewer_id (
        first_name,
        last_name,
        display_name,
        profile_image_url
      )
    `)
    .eq("space_id", spaceId)
    .eq("review_type", "space_review")
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getUserReviews(userId: string, type: "received" | "given" = "received") {
  const supabase = await createClient()

  const column = type === "received" ? "reviewee_id" : "reviewer_id"

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      *,
      profiles:reviewer_id (
        first_name,
        last_name,
        display_name,
        profile_image_url
      ),
      spaces (
        title,
        images
      )
    `)
    .eq(column, userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Client-side review functions
export function useReviews() {
  const supabase = createBrowserClient()

  return {
    async canReview(bookingId: string) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false

      // Check if booking exists and is completed
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, status, guest_id, host_id")
        .eq("id", bookingId)
        .eq("status", "completed")
        .single()

      if (!booking) return false

      // Check if user is guest or host
      const isParticipant = booking.guest_id === user.id || booking.host_id === user.id
      if (!isParticipant) return false

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("reviewer_id", user.id)
        .single()

      return !existingReview
    },
  }
}
