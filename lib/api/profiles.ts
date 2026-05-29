import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (profileError) return null

  return {
    ...user,
    profile,
  }
}

export async function getProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

  if (error) throw error
  if (!data) throw new Error("Profile not found")
  return data
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()

  if (error) throw error
  return data
}

export async function uploadProfileImage(userId: string, file: File) {
  const supabase = await createClient()

  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}-${Math.random()}.${fileExt}`
  const filePath = `profiles/${fileName}`

  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

  // Update profile with new image URL
  const { data: profile, error: updateError } = await supabase
    .from("profiles")
    .update({ profile_image_url: data.publicUrl })
    .eq("id", userId)
    .select()
    .single()

  if (updateError) throw updateError
  return profile
}

// Client-side profile functions
export function useProfile() {
  const supabase = createBrowserClient()

  return {
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },

    async updatePassword(newPassword: string) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
    },

    async updateEmail(newEmail: string) {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })
      if (error) throw error
    },
  }
}
