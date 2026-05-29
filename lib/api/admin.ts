import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/database.types"

type AdminSettings = Database["public"]["Tables"]["admin_settings"]["Row"]

export async function isAdmin(userId?: string) {
  const supabase = await createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin, is_superuser")
    .eq("id", targetUserId)
    .single()

  if (error) return false
  return data.is_admin || data.is_superuser
}

export async function getAdminSettings() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("admin_settings").select("*").order("setting_key")

  if (error) throw error
  return data
}

export async function updateAdminSetting(key: string, value: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("admin_settings")
    .upsert({
      setting_key: key,
      setting_value: value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAllUsers(limit = 50, offset = 0) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getAllSpacesAdmin(limit = 50, offset = 0) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("spaces")
    .select(`
      *,
      profiles:host_id (
        first_name,
        last_name,
        display_name,
        email
      ),
      space_categories (
        name,
        slug
      )
    `)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function toggleSpaceFeatured(spaceId: string, featured: boolean) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("spaces")
    .update({ is_featured: featured })
    .eq("id", spaceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleSpaceActive(spaceId: string, active: boolean) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("spaces")
    .update({ is_active: active })
    .eq("id", spaceId)
    .select()
    .single()

  if (error) throw error
  return data
}
