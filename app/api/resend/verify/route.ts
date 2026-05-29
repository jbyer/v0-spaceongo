import { NextResponse, type NextRequest } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { WelcomeEmail } from "@/components/emails/welcome-email"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js" // Import supabase client

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const origin = request.nextUrl.origin

  // Email verification requested

  if (!token || !email) {
    // Missing token or email
    return NextResponse.redirect(`${origin}/auth/error?error=invalid_link`)
  }

  try {
    // Use service role client for full access
    const supabaseAdmin = createServiceClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Find the verification record
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from("email_verifications")
      .select("*")
      .eq("token", token)
      .eq("email", email)
      .single()

    if (verifyError || !verification) {
      return NextResponse.redirect(`${origin}/auth/error?error=invalid_token`)
    }

    // Check if token has expired
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.redirect(`${origin}/auth/error?error=token_expired`)
    }

    // Check if already verified
    if (verification.verified_at) {
      return NextResponse.redirect(`${origin}/auth/login?message=already_verified`)
    }

    // Mark as verified in our tracking table
    const { error: updateError } = await supabaseAdmin
      .from("email_verifications")
      .update({
        verified_at: new Date().toISOString(),
      })
      .eq("id", verification.id)

    if (updateError) {
      console.error("Failed to update verification status:", updateError)
    }

    // Update the Supabase auth user's email_confirmed_at using admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    )

    if (authError) {
      console.error("Failed to update auth user email confirmation:", authError)
    }

    // Get user profile to check role and update verification status
    const { data: profile, error: profileFetchError } = await supabaseAdmin
      .from("profiles")
      .select("first_name, display_name, is_host, user_role")
      .eq("id", verification.user_id)
      .single()

    if (profileFetchError) {
      console.error("Failed to fetch profile:", profileFetchError)
    }

    // Determine if this is a host user
    const isHostUser = profile?.is_host === true || profile?.user_role === "host"

    // Update the profiles table with verification status
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        email_confirmed_at: new Date().toISOString(),
        email_verified: true,
        // Ensure host role is properly set if it was intended
        ...(isHostUser && { is_host: true, user_role: "host" }),
      })
      .eq("id", verification.user_id)

    if (profileError) {
      console.error("Failed to update profile verification:", profileError)
    }

    // Send welcome email
    const resend = getResendClient()
    if (resend && profile) {
      try {
        await resend.emails.send({
          from: EMAIL_CONFIG.fromEmail,
          to: [email],
          replyTo: EMAIL_CONFIG.replyTo,
          subject: `Welcome to ${EMAIL_CONFIG.appName}!`,
          react: WelcomeEmail({
            firstName: profile.first_name || profile.display_name || "there",
            appName: EMAIL_CONFIG.appName,
            dashboardUrl: `${origin}/dashboard`,
          }),
        })
        console.log("Welcome email sent successfully")
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
        // Don't fail the verification if welcome email fails
      }
    }

    // Redirect to appropriate success page based on user role
    if (isHostUser) {
      // Host users go to host-specific success page with redirect to add-space
      return NextResponse.redirect(`${origin}/auth/verification-success?role=host`)
    }
    
    return NextResponse.redirect(`${origin}/auth/verification-success`)
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.redirect(`${origin}/auth/error?error=verification_failed`)
  }
}
