import { createClient } from "@/lib/supabase/client"

/**
 * Send a password reset email to the specified email address
 * @param email - The user's email address
 * @returns Object with success status and optional error message
 */
export async function sendPasswordResetEmail(email: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?type=recovery`,
    })

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to send reset email. Please try again.",
      }
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred. Please try again.",
    }
  }
}

/**
 * Update user password after reset
 * @param newPassword - The new password
 * @returns Object with success status and optional error message
 */
export async function updatePassword(newPassword: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to update password. Please try again.",
      }
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred. Please try again.",
    }
  }
}
