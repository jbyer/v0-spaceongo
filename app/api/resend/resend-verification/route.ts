import { NextResponse } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { VerificationEmail } from "@/components/emails/verification-email"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Find the user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, display_name, email_confirmed_at")
      .eq("email", email)
      .single()

    if (profileError || !profile) {
      // Don't reveal if email exists for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification link will be sent.",
      })
    }

    // Check if already verified
    if (profile.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: "This email is already verified. You can sign in.",
        alreadyVerified: true,
      })
    }

    const resend = getResendClient()

    if (!resend) {
      // Fallback to Supabase email
      return NextResponse.json(
        {
          error: "Email service not configured",
          fallback: "supabase",
        },
        { status: 503 },
      )
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Update the verification token
    const { error: tokenError } = await supabase.from("email_verifications").upsert(
      {
        user_id: profile.id,
        email,
        token: verificationToken,
        expires_at: tokenExpiry.toISOString(),
        created_at: new Date().toISOString(),
        verified_at: null, // Reset verification status
      },
      {
        onConflict: "user_id",
      },
    )

    if (tokenError) {
      console.error("Failed to update verification token:", tokenError)
    }

    // Build verification URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || ""
    const verificationUrl = `${origin}/api/resend/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`

    // Send new verification email
    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Verify your ${EMAIL_CONFIG.appName} account`,
      react: VerificationEmail({
        firstName: profile.first_name || profile.display_name || "there",
        verificationUrl,
        appName: EMAIL_CONFIG.appName,
      }),
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email", fallback: "supabase" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
      provider: "resend",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
