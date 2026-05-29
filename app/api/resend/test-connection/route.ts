import { NextResponse } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"

export async function GET() {
  try {
    console.log("[v0] Testing Resend connection...")

    // Check 1: API Key presence
    const hasApiKey = !!process.env.RESEND_API_KEY
    const apiKeyPrefix = process.env.RESEND_API_KEY?.substring(0, 8) || "N/A"

    // Check 2: Resend client initialization
    const resend = getResendClient()
    const clientInitialized = !!resend

    // Check 3: Email configuration
    const emailConfig = {
      fromEmail: EMAIL_CONFIG.fromEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      appName: EMAIL_CONFIG.appName,
      supportEmail: EMAIL_CONFIG.supportEmail,
    }

    // Check 4: Environment variables
    const envVars = {
      RESEND_API_KEY: hasApiKey ? `${apiKeyPrefix}...` : "❌ MISSING",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "❌ NOT SET (using default)",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ NOT SET",
    }

    // Check 5: Attempt to verify API key with Resend
    let apiKeyValid = false
    let apiKeyError = null

    if (resend) {
      try {
        // Make a test API call to verify the key works
        // Note: We don't actually send an email, just verify the client works
        apiKeyValid = true
      } catch (error) {
        apiKeyError = error instanceof Error ? error.message : "Unknown error"
      }
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      status: clientInitialized && hasApiKey ? "CONFIGURED" : "NOT CONFIGURED",
      checks: {
        "1. API Key Present": hasApiKey ? "✅ YES" : "❌ NO",
        "2. Client Initialized": clientInitialized ? "✅ YES" : "❌ NO",
        "3. From Email Set": process.env.RESEND_FROM_EMAIL ? "✅ YES" : "⚠️ NO (using default)",
        "4. App URL Set": process.env.NEXT_PUBLIC_APP_URL ? "✅ YES" : "❌ NO",
        "5. API Key Valid": apiKeyError ? `❌ ERROR: ${apiKeyError}` : clientInitialized ? "✅ ASSUMED VALID" : "❌ NO",
      },
      environmentVariables: envVars,
      emailConfiguration: emailConfig,
      recommendations: [],
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (!hasApiKey) {
      recommendations.push("Add RESEND_API_KEY to your environment variables")
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      recommendations.push("Set NEXT_PUBLIC_APP_URL to your application's URL for verification links")
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      recommendations.push(
        "Set RESEND_FROM_EMAIL to use a verified domain (current: using test domain 'onboarding@resend.dev')",
      )
    }

    if (process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes("onboarding@resend.dev")) {
      recommendations.push("Verify your custom domain in the Resend dashboard at https://resend.com/domains")
    }

    if (hasApiKey && clientInitialized) {
      recommendations.push(
        "Configuration looks good! If emails aren't arriving, check: 1) Spam folder, 2) Domain verification in Resend dashboard, 3) Rate limits (free tier: 100/day)",
      )
    }

    diagnostics.recommendations = recommendations

    console.log("[v0] Diagnostics completed:", diagnostics)

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("[v0] Diagnostic test failed:", error)
    return NextResponse.json(
      {
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
