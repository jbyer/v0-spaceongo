import { NextResponse } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { VerificationEmail } from "@/components/emails/verification-email"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName, userId, userRole } = body

    // Validate required fields
    if (!email || !firstName || !userId) {
      return NextResponse.json({ error: "Missing required fields: email, firstName, userId" }, { status: 400 })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const resend = getResendClient()

    if (!resend) {
      return NextResponse.json(
        {
          error: "Email service not configured",
          fallback: "supabase",
          message: "Falling back to Supabase email service",
        },
        { status: 503 },
      )
    }

    // Generate a secure verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store the verification token in the database using service role for full access
    const { createClient: createServiceClient } = await import("@supabase/supabase-js")
    const supabaseAdmin = createServiceClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Update profile with email_verified flag if needed
    // The trigger now creates profile with is_host and user_role, so we only need to mark email as unverified
    if (userRole) {
      console.log("[v0] Profile should have been created by auth trigger with is_host:", userRole === "host", "for user:", userId)
    }

    try {
      // First, delete any existing tokens for this email
      await supabaseAdmin.from("email_verifications").delete().eq("email", email)
      
      // Then insert the new token
      const { error: tokenError } = await supabaseAdmin.from("email_verifications").insert({
        user_id: userId,
        email,
        token: verificationToken,
        expires_at: tokenExpiry.toISOString(),
        created_at: new Date().toISOString(),
      })

      if (tokenError) {
        console.error("Failed to store verification token:", tokenError)
      }
    } catch (dbError) {
      console.error("Database error storing token:", dbError)
    }

    // Build verification URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || ""
    const verificationUrl = `${origin}/api/resend/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`

    // Send verification email via Resend using React component
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Verify your ${EMAIL_CONFIG.appName} account`,
      react: VerificationEmail({
        firstName,
        verificationUrl,
        appName: EMAIL_CONFIG.appName,
      }),
    })

    if (error) {
      console.error("Resend email error:", error)
      return NextResponse.json(
        {
          error: "Failed to send verification email",
          details: error.message,
          fallback: "supabase",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
      emailId: data?.id,
      provider: "resend",
    })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
