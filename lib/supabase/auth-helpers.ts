import { createServerClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  display_name?: string
  is_admin: boolean
  is_superuser: boolean
  is_host: boolean
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createServerClient()

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error || !profile) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return profile
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error getting current user:", userError)
    return null
  }

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error || !profile) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return profile
}

export async function isUserAdmin(userId?: string): Promise<boolean> {
  if (!userId) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    userId = user.id
  }

  const profile = await getUserProfile(userId)
  return profile?.is_admin || false
}

export async function isUserSuperuser(userId?: string): Promise<boolean> {
  if (!userId) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    userId = user.id
  }

  const profile = await getUserProfile(userId)
  return profile?.is_superuser || false
}

export async function checkAdminAccess(): Promise<{
  hasAccess: boolean
  user: UserProfile | null
  redirectTo?: string
}> {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return {
        hasAccess: false,
        user: null,
        redirectTo: "/login",
      }
    }

    if (!profile.is_superuser) {
      return {
        hasAccess: false,
        user: profile,
        redirectTo: "/dashboard",
      }
    }

    return {
      hasAccess: true,
      user: profile,
    }
  } catch (error) {
    console.error("Admin access check error:", error)
    return {
      hasAccess: false,
      user: null,
      redirectTo: "/login",
    }
  }
}
