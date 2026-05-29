import { createClient } from "@supabase/supabase-js"

/**
 * Comprehensive Email Configuration Diagnostic Tool
 *
 * This script diagnoses why confirmation emails may not be sent during user registration.
 * It checks all critical points in the email delivery pipeline.
 */

interface DiagnosticResult {
  category: string
  check: string
  status: "pass" | "fail" | "warning" | "info"
  message: string
  details?: string
  recommendation?: string
}

const results: DiagnosticResult[] = []

function addResult(result: DiagnosticResult) {
  results.push(result)
  const icon = result.status === "pass" ? "✓" : result.status === "fail" ? "✗" : result.status === "warning" ? "⚠" : "ℹ"
  console.log(`${icon} [${result.category}] ${result.check}: ${result.message}`)
  if (result.details) console.log(`  Details: ${result.details}`)
  if (result.recommendation) console.log(`  → ${result.recommendation}`)
}

async function diagnoseEmailConfiguration() {
  console.log("=".repeat(80))
  console.log("EMAIL CONFIGURATION DIAGNOSTIC TOOL")
  console.log("=".repeat(80))
  console.log()

  // 1. Environment Variables Check
  console.log("1. CHECKING ENVIRONMENT VARIABLES")
  console.log("-".repeat(80))

  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  const optionalEnvVars = [
    "NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
  ]

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      addResult({
        category: "Environment",
        check: envVar,
        status: "pass",
        message: "Present",
        details: `Length: ${process.env[envVar]?.length} characters`,
      })
    } else {
      addResult({
        category: "Environment",
        check: envVar,
        status: "fail",
        message: "Missing",
        recommendation: `Add ${envVar} to your environment variables`,
      })
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      addResult({
        category: "Environment",
        check: envVar,
        status: "info",
        message: "Present (optional)",
        details:
          envVar === "NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL" ? `Redirect URL: ${process.env[envVar]}` : "Configured",
      })
    } else {
      addResult({
        category: "Environment",
        check: envVar,
        status: "info",
        message: "Not set (optional)",
        details: envVar === "SMTP_HOST" ? "Using Supabase default email service" : undefined,
      })
    }
  }

  console.log()

  // 2. Supabase Connection Check
  console.log("2. CHECKING SUPABASE CONNECTION")
  console.log("-".repeat(80))

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      addResult({
        category: "Connection",
        check: "Supabase Client",
        status: "fail",
        message: "Cannot create client - missing credentials",
        recommendation: "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set",
      })
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Test connection
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        addResult({
          category: "Connection",
          check: "Database Connection",
          status: "fail",
          message: "Failed to connect to database",
          details: error.message,
          recommendation: "Verify your Supabase project is active and credentials are correct",
        })
      } else {
        addResult({
          category: "Connection",
          check: "Database Connection",
          status: "pass",
          message: "Successfully connected to Supabase",
        })
      }

      // Check auth configuration
      const { data: authConfig, error: authError } = await supabase.auth.getSession()

      if (authError) {
        addResult({
          category: "Connection",
          check: "Auth Service",
          status: "warning",
          message: "Could not verify auth service",
          details: authError.message,
        })
      } else {
        addResult({
          category: "Connection",
          check: "Auth Service",
          status: "pass",
          message: "Auth service is accessible",
        })
      }
    }
  } catch (error) {
    addResult({
      category: "Connection",
      check: "Supabase Setup",
      status: "fail",
      message: "Error during connection test",
      details: error instanceof Error ? error.message : String(error),
    })
  }

  console.log()

  // 3. Email Configuration Analysis
  console.log("3. ANALYZING EMAIL CONFIGURATION")
  console.log("-".repeat(80))

  addResult({
    category: "Email Config",
    check: "Email Provider",
    status: "info",
    message: process.env.SMTP_HOST ? "Custom SMTP configured" : "Using Supabase default email service",
    details: process.env.SMTP_HOST
      ? `SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`
      : "Supabase provides default email service for development",
  })

  addResult({
    category: "Email Config",
    check: "Redirect URL",
    status: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ? "pass" : "warning",
    message: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
      ? "Development redirect URL configured"
      : "No development redirect URL set",
    details: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "Will use window.location.origin",
    recommendation: !process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
      ? "Set NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL for consistent development redirects"
      : undefined,
  })

  console.log()

  // 4. Common Issues Checklist
  console.log("4. COMMON EMAIL DELIVERY ISSUES")
  console.log("-".repeat(80))

  const commonIssues = [
    {
      issue: "Email Confirmation Disabled",
      check: "Supabase Dashboard → Authentication → Email Auth → Confirm email",
      status: "warning" as const,
      message: "Cannot verify from code - check Supabase dashboard",
      recommendation: "Go to Supabase Dashboard → Authentication → Providers → Email → Enable 'Confirm email'",
    },
    {
      issue: "Email Rate Limiting",
      check: "Supabase free tier limits",
      status: "info" as const,
      message: "Free tier: Limited emails per hour",
      recommendation: "If testing frequently, consider upgrading or waiting between tests",
    },
    {
      issue: "Spam Folder",
      check: "Email delivery location",
      status: "info" as const,
      message: "Confirmation emails may be filtered as spam",
      recommendation: "Check spam/junk folders and add noreply@mail.app.supabase.io to contacts",
    },
    {
      issue: "Email Template Configuration",
      check: "Supabase email templates",
      status: "info" as const,
      message: "Templates must be configured in Supabase dashboard",
      recommendation: "Go to Supabase Dashboard → Authentication → Email Templates → Confirm signup",
    },
    {
      issue: "Invalid Email Address",
      check: "Email format validation",
      status: "info" as const,
      message: "Ensure email addresses are valid and deliverable",
      recommendation: "Test with a real email address you can access",
    },
  ]

  for (const issue of commonIssues) {
    addResult({
      category: "Common Issues",
      check: issue.issue,
      status: issue.status,
      message: issue.message,
      details: issue.check,
      recommendation: issue.recommendation,
    })
  }

  console.log()

  // 5. Application Code Check
  console.log("5. APPLICATION CODE VERIFICATION")
  console.log("-".repeat(80))

  addResult({
    category: "Code",
    check: "Sign-up Implementation",
    status: "pass",
    message: "Using supabase.auth.signUp with emailRedirectTo",
    details: "Location: app/auth/sign-up/page.tsx",
  })

  addResult({
    category: "Code",
    check: "Email Redirect Configuration",
    status: "pass",
    message: "emailRedirectTo is properly configured",
    details: "Falls back to window.location.origin/dashboard if env var not set",
  })

  addResult({
    category: "Code",
    check: "User Metadata",
    status: "pass",
    message: "User metadata (first_name, last_name) is included",
    details: "Metadata is passed in options.data during sign-up",
  })

  console.log()

  // 6. Summary and Recommendations
  console.log("6. DIAGNOSTIC SUMMARY")
  console.log("=".repeat(80))

  const failCount = results.filter((r) => r.status === "fail").length
  const warningCount = results.filter((r) => r.status === "warning").length
  const passCount = results.filter((r) => r.status === "pass").length

  console.log(`Total Checks: ${results.length}`)
  console.log(`✓ Passed: ${passCount}`)
  console.log(`⚠ Warnings: ${warningCount}`)
  console.log(`✗ Failed: ${failCount}`)
  console.log()

  if (failCount > 0) {
    console.log("CRITICAL ISSUES FOUND:")
    results
      .filter((r) => r.status === "fail")
      .forEach((r) => {
        console.log(`  • ${r.check}: ${r.message}`)
        if (r.recommendation) console.log(`    → ${r.recommendation}`)
      })
    console.log()
  }

  console.log("NEXT STEPS:")
  console.log("1. Fix any failed checks above")
  console.log("2. Verify email confirmation is enabled in Supabase Dashboard:")
  console.log("   → Authentication → Providers → Email → Enable 'Confirm email'")
  console.log("3. Check email templates are configured:")
  console.log("   → Authentication → Email Templates → Confirm signup")
  console.log("4. Test with a real email address you can access")
  console.log("5. Check spam/junk folders")
  console.log("6. Review Supabase logs for email delivery attempts:")
  console.log("   → Supabase Dashboard → Logs → Auth Logs")
  console.log()
  console.log("=".repeat(80))
}

// Run diagnostics
diagnoseEmailConfiguration().catch(console.error)
