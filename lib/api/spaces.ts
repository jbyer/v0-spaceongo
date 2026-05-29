import { createClient as createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"
import { logUserActivity } from "./activities"

type Space = Database["public"]["Tables"]["spaces"]["Row"]
type SpaceInsert = Database["public"]["Tables"]["spaces"]["Insert"]
type SpaceUpdate = Database["public"]["Tables"]["spaces"]["Update"]

export async function getSpaces(filters?: {
  category?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  capacity?: number
  featured?: boolean
  limit?: number
  offset?: number
}) {
  const supabase = await createBrowserClient()

  let query = supabase
    .from("spaces")
    .select(`
      *,
      profiles:host_id (
        id,
        first_name,
        last_name,
        display_name,
        profile_image_url
      ),
      space_categories (
        name,
        slug
      )
    `)
    .eq("is_active", true)

  if (filters?.category) {
    query = query.eq("space_type", filters.category)
  }

  if (filters?.location) {
    query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
  }

  if (filters?.minPrice) {
    query = query.gte("price_per_hour", filters.minPrice)
  }

  if (filters?.maxPrice) {
    query = query.lte("price_per_hour", filters.maxPrice)
  }

  if (filters?.capacity) {
    query = query.gte("capacity", filters.capacity)
  }

  if (filters?.featured) {
    query = query.eq("is_featured", true)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getSpaceById(id: string) {
  const supabase = await createBrowserClient()

  const { data, error } = await supabase
    .from("spaces")
    .select(`
      *,
      profiles:host_id (
        id,
        first_name,
        last_name,
        display_name,
        profile_image_url,
        bio
      ),
      space_categories (
        name,
        slug
      ),
      reviews (
        id,
        rating,
        title,
        comment,
        created_at,
        profiles:reviewer_id (
          first_name,
          last_name,
          display_name,
          profile_image_url
        )
      )
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error) throw error
  return data
}

export async function createSpace(spaceData: SpaceInsert) {
  const supabase = await createBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("spaces")
    .insert({
      ...spaceData,
      host_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSpace(id: string, updates: SpaceUpdate) {
  const supabase = await createBrowserClient()

  const { data, error } = await supabase.from("spaces").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export async function deleteSpace(id: string) {
  const supabase = await createBrowserClient()

  const { error } = await supabase.from("spaces").delete().eq("id", id)

  if (error) throw error
}

export async function getFeaturedSpaces(limit = 6) {
  const supabase = await createBrowserClient()

  const { data, error } = await supabase
    .from("spaces")
    .select(`
      *,
      profiles:host_id (
        id,
        first_name,
        last_name,
        display_name,
        profile_image_url
      ),
      space_categories (
        name,
        slug
      )
    `)
    .eq("is_featured", true)
    .eq("is_active", true)
    .limit(limit)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

// Client-side functions
export function useSpaces() {
  const supabase = createBrowserClient()

  return {
    async toggleFavorite(spaceId: string) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("space_id", spaceId)
        .single()

      if (existing) {
        // Remove from favorites
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("space_id", spaceId)

        if (error) throw error

        await logUserActivity(user.id, "favorite_removed", `Removed space from favorites`, { space_id: spaceId })

        return false
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          space_id: spaceId,
        })

        if (error) throw error

        await logUserActivity(user.id, "favorite_added", `Added space to favorites`, { space_id: spaceId })

        return true
      }
    },

    async getUserFavorites() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          space_id,
          spaces (
            *,
            profiles:host_id (
              id,
              first_name,
              last_name,
              display_name,
              profile_image_url
            ),
            space_categories (
              name,
              slug
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data?.map((item: any) => item.spaces).filter(Boolean) || []
    },
  }
}
