import { NextResponse } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { VerificationEmail } from "@/components/emails/verification-email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const resend = getResendClient()

    if (!resend) {
      return NextResponse.json(
        {
          error: "Resend not configured - check your RESEND_API_KEY",
          fallback: "supabase",
        },
        { status: 503 },
      )
    }

    console.log("Sending test email to:", email)

    const testVerificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/verify-email?test=true`

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `[TEST] Verify your ${EMAIL_CONFIG.appName} account`,
      react: VerificationEmail({
        firstName: "Test User",
        verificationUrl: testVerificationUrl,
        appName: EMAIL_CONFIG.appName,
      }),
    })

    if (error) {
      console.error("Test email failed:", error)
      return NextResponse.json(
        {
          error: "Failed to send test email",
          details: error.message,
          apiError: error,
        },
        { status: 500 },
      )
    }

    console.log("Test email sent successfully:", data?.id)

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailId: data?.id,
      provider: "resend",
      sentTo: email,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
