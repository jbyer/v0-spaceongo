import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, token, newPassword } = body

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Create admin client to update user password
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Verify the token is valid first
    const { data: resetRecord, error: fetchError } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .eq("token", token)
      .eq("email", email.toLowerCase())
      .eq("used", false)
      .maybeSingle()

    if (fetchError || !resetRecord) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Check if token has expired
    const expiresAt = new Date(resetRecord.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Reset link has expired" }, { status: 400 })
    }

    // Get the user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userError) {
      console.error("[v0] Error listing users:", userError)
      return NextResponse.json({ error: "Failed to find user" }, { status: 500 })
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    // Mark token as used
    await supabaseAdmin
      .from("password_resets")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", resetRecord.id)

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("[v0] Update password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
