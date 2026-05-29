import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, email, verifyOnly = false } = body

    if (!token || !email) {
      return NextResponse.json({ valid: false, error: "Missing token or email" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if token exists and is valid
    const { data: resetRecord, error: fetchError } = await supabase
      .from("password_resets")
      .select("*")
      .eq("token", token)
      .eq("email", email.toLowerCase())
      .eq("used", false)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error fetching reset token:", fetchError)
      return NextResponse.json({ valid: false, error: "Failed to verify token" }, { status: 500 })
    }

    if (!resetRecord) {
      return NextResponse.json({ valid: false, error: "Invalid or already used reset link" }, { status: 400 })
    }

    // Check if token has expired
    const expiresAt = new Date(resetRecord.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "Reset link has expired" }, { status: 400 })
    }

    // If just verifying (not consuming), return valid
    if (verifyOnly) {
      return NextResponse.json({ valid: true })
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from("password_resets")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", resetRecord.id)

    if (updateError) {
      console.error("[v0] Error marking token as used:", updateError)
    }

    return NextResponse.json({
      valid: true,
      userId: resetRecord.user_id,
    })
  } catch (error) {
    console.error("[v0] Verify password reset error:", error)
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
