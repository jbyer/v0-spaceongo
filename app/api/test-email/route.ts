import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Test Email Delivery Endpoint
 *
 * This endpoint allows administrators to test email delivery
 * by triggering a test confirmation email.
 *
 * Usage: POST /api/test-email
 * Body: { email: "test@example.com" }
 */

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, is_superuser")
      .eq("id", user.id)
      .single()

    if (profileError || (!profile?.is_admin && !profile?.is_superuser)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Generate a test password
    const testPassword = `Test${Math.random().toString(36).slice(2, 10)}!1A`

    // Attempt to create a test user
    const { data, error } = await supabase.auth.signUp({
      email,
      password: testPassword,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${request.headers.get("origin")}/auth/callback`,
        data: {
          first_name: "Test",
          last_name: "User",
          display_name: "Test User",
          email,
        },
      },
    })

    if (error) {
      console.error("[v0] Test email error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: "Failed to send test email",
          recommendation: "Check Supabase dashboard for email configuration",
        },
        { status: 400 },
      )
    }

    // Check if email confirmation is required
    const emailConfirmationRequired = !data.session

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      details: {
        email,
        userId: data.user?.id,
        emailConfirmationRequired,
        confirmationSent: data.user?.confirmation_sent_at,
        note: emailConfirmationRequired
          ? "Email confirmation is enabled. Check the inbox for confirmation email."
          : "Email confirmation is disabled. User was created without confirmation.",
      },
      recommendations: [
        "Check spam/junk folder if email not received",
        "Verify email templates in Supabase Dashboard → Authentication → Email Templates",
        "Check Supabase logs for email delivery status",
        "Ensure SMTP is properly configured if using custom email provider",
      ],
    })
  } catch (error) {
    console.error("[v0] Test email endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/test-email",
    method: "POST",
    description: "Test email delivery by sending a confirmation email",
    authentication: "Required - Admin only",
    body: {
      email: "Email address to send test confirmation to",
    },
    example: {
      email: "test@example.com",
    },
  })
}
