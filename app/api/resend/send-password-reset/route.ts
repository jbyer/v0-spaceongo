import { NextResponse } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user exists
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, email")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (profileError) {
      console.error("[v0] Error checking user:", profileError)
    }

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (!profile) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link will be sent.",
      })
    }

    const resend = getResendClient()

    if (!resend) {
      return NextResponse.json(
        {
          error: "Email service not configured",
          fallback: "supabase",
        },
        { status: 503 },
      )
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store the reset token in the database
    const { error: tokenError } = await supabase.from("password_resets").upsert(
      {
        user_id: profile.id,
        email: email.toLowerCase(),
        token: resetToken,
        expires_at: tokenExpiry.toISOString(),
        created_at: new Date().toISOString(),
        used: false,
      },
      {
        onConflict: "user_id",
      },
    )

    if (tokenError) {
      console.error("[v0] Failed to store reset token:", tokenError)
      // Continue anyway - try to send via Supabase as fallback
      return NextResponse.json(
        {
          error: "Failed to process reset request",
          fallback: "supabase",
        },
        { status: 500 },
      )
    }

    // Build reset URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || ""
    const resetUrl = `${origin}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

    // Check if a template ID is configured
    const templateId = process.env.RESEND_PASSWORD_RESET_TEMPLATE_ID

    let data, error

    if (templateId) {
      // Use Resend template from dashboard with correct API format
      console.log("[v0] Using Resend password reset template ID:", templateId)
      const result = await resend.emails.send({
        from: EMAIL_CONFIG.fromEmail,
        to: [email],
        replyTo: EMAIL_CONFIG.replyTo,
        subject: `Reset your ${EMAIL_CONFIG.appName} password`,
        // Use the correct template object format per Resend API docs
        // @ts-ignore - Resend SDK types may not include template
        template: {
          id: templateId,
          variables: {
            firstName: profile.first_name || "there",
            first_name: profile.first_name || "there",
            name: profile.first_name || "there",
            resetUrl: resetUrl,
            reset_url: resetUrl,
            link: resetUrl,
            appName: EMAIL_CONFIG.appName,
            app_name: EMAIL_CONFIG.appName,
          },
        },
      })
      data = result.data
      error = result.error
      console.log("[v0] Password reset template email result:", { data, error })
    } else {
      // Fallback to inline HTML if no template ID configured
      const result = await resend.emails.send({
        from: EMAIL_CONFIG.fromEmail,
        to: [email],
        replyTo: EMAIL_CONFIG.replyTo,
        subject: `Reset your ${EMAIL_CONFIG.appName} password`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Reset Your Password</h2>
            <p>Hi ${profile.first_name || "there"},</p>
            <p>We received a request to reset your password for your ${EMAIL_CONFIG.appName} account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">This email was sent by ${EMAIL_CONFIG.appName}</p>
          </div>
        `,
      })
      data = result.data
      error = result.error
    }

    if (error) {
      console.error("[v0] Resend email error:", error)
      return NextResponse.json(
        {
          error: "Failed to send reset email",
          details: error.message,
          fallback: "supabase",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
      emailId: data?.id,
      provider: "resend",
    })
  } catch (error) {
    console.error("[v0] Send password reset error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
