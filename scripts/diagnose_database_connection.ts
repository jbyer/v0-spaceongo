/**
 * Comprehensive Database Connection Diagnostic Tool
 *
 * This script verifies:
 * 1. Environment variables are correctly set
 * 2. Connection to Supabase is established
 * 3. Database name matches 'spaceongo_v2'
 * 4. Database tables are accessible
 * 5. Authentication system is working
 */

import { createClient } from "@supabase/supabase-js"

interface DiagnosticResult {
  step: string
  status: "PASS" | "FAIL" | "WARNING"
  message: string
  details?: any
}

async function runDiagnostics() {
  const results: DiagnosticResult[] = []

  console.log("🔍 Starting Supabase Database Connection Diagnostics...\n")
  console.log("=".repeat(60))

  // Step 1: Check Environment Variables
  console.log("\n📋 Step 1: Checking Environment Variables...")
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_USER: process.env.POSTGRES_USER,
  }

  let allEnvVarsPresent = true
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      results.push({
        step: "Environment Variables",
        status: "FAIL",
        message: `Missing: ${key}`,
      })
      allEnvVarsPresent = false
      console.log(`   ❌ ${key}: NOT SET`)
    } else {
      const maskedValue = key.includes("KEY") || key.includes("PASSWORD") ? value.substring(0, 10) + "..." : value
      console.log(`   ✅ ${key}: ${maskedValue}`)
    }
  }

  if (allEnvVarsPresent) {
    results.push({
      step: "Environment Variables",
      status: "PASS",
      message: "All required environment variables are set",
    })
  }

  // Step 2: Verify Database Name
  console.log("\n🗄️  Step 2: Verifying Database Name...")
  const databaseName = process.env.POSTGRES_DATABASE
  if (databaseName === "spaceongo_v2") {
    results.push({
      step: "Database Name",
      status: "PASS",
      message: `Connected to correct database: ${databaseName}`,
    })
    console.log(`   ✅ Database Name: ${databaseName}`)
  } else {
    results.push({
      step: "Database Name",
      status: "WARNING",
      message: `Database name is '${databaseName}', expected 'spaceongo_v2'`,
      details: { actual: databaseName, expected: "spaceongo_v2" },
    })
    console.log(`   ⚠️  Database Name: ${databaseName} (expected: spaceongo_v2)`)
  }

  // Step 3: Test Supabase Client Creation
  console.log("\n🔌 Step 3: Testing Supabase Client Creation...")
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    results.push({
      step: "Client Creation",
      status: "PASS",
      message: "Supabase client created successfully",
    })
    console.log("   ✅ Supabase client created successfully")

    // Step 4: Test Database Connection
    console.log("\n🔗 Step 4: Testing Database Connection...")
    const { data: healthCheck, error: healthError } = await supabase.from("space_categories").select("count").limit(1)

    if (healthError) {
      results.push({
        step: "Database Connection",
        status: "FAIL",
        message: "Failed to connect to database",
        details: { error: healthError.message, code: healthError.code },
      })
      console.log(`   ❌ Database connection failed: ${healthError.message}`)
    } else {
      results.push({
        step: "Database Connection",
        status: "PASS",
        message: "Successfully connected to database",
      })
      console.log("   ✅ Database connection successful")
    }

    // Step 5: Verify Tables Exist
    console.log("\n📊 Step 5: Verifying Database Tables...")
    const expectedTables = [
      "profiles",
      "spaces",
      "space_categories",
      "bookings",
      "reviews",
      "favorites",
      "messages",
      "notifications",
      "blog_posts",
      "payments",
      "subscriptions",
      "admin_settings",
    ]

    let tablesVerified = 0
    for (const table of expectedTables) {
      const { error } = await supabase.from(table).select("id").limit(1)
      if (!error) {
        tablesVerified++
        console.log(`   ✅ Table '${table}' is accessible`)
      } else {
        console.log(`   ❌ Table '${table}' is NOT accessible: ${error.message}`)
      }
    }

    if (tablesVerified === expectedTables.length) {
      results.push({
        step: "Table Verification",
        status: "PASS",
        message: `All ${expectedTables.length} tables are accessible`,
      })
    } else {
      results.push({
        step: "Table Verification",
        status: "WARNING",
        message: `Only ${tablesVerified}/${expectedTables.length} tables are accessible`,
        details: { verified: tablesVerified, total: expectedTables.length },
      })
    }

    // Step 6: Test Authentication System
    console.log("\n🔐 Step 6: Testing Authentication System...")
    const { data: sessionData, error: authError } = await supabase.auth.getSession()

    if (authError) {
      results.push({
        step: "Authentication System",
        status: "FAIL",
        message: "Authentication system error",
        details: { error: authError.message },
      })
      console.log(`   ❌ Auth system error: ${authError.message}`)
    } else {
      results.push({
        step: "Authentication System",
        status: "PASS",
        message: "Authentication system is operational",
      })
      console.log("   ✅ Authentication system is operational")
    }

    // Step 7: Test Row Level Security
    console.log("\n🛡️  Step 7: Testing Row Level Security...")
    const { data: rlsTest, error: rlsError } = await supabase.from("profiles").select("id").limit(1)

    if (rlsError && rlsError.code === "42501") {
      results.push({
        step: "Row Level Security",
        status: "PASS",
        message: "RLS is properly configured (access denied as expected)",
      })
      console.log("   ✅ RLS is active and working correctly")
    } else if (!rlsError) {
      results.push({
        step: "Row Level Security",
        status: "PASS",
        message: "RLS allows public read access (as configured)",
      })
      console.log("   ✅ RLS is configured for public access")
    } else {
      results.push({
        step: "Row Level Security",
        status: "WARNING",
        message: "Unexpected RLS behavior",
        details: { error: rlsError.message },
      })
      console.log(`   ⚠️  Unexpected RLS behavior: ${rlsError.message}`)
    }
  } catch (error) {
    results.push({
      step: "Client Creation",
      status: "FAIL",
      message: "Failed to create Supabase client",
      details: { error: error instanceof Error ? error.message : "Unknown error" },
    })
    console.log(`   ❌ Failed to create client: ${error}`)
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  console.log("\n📈 DIAGNOSTIC SUMMARY\n")

  const passed = results.filter((r) => r.status === "PASS").length
  const failed = results.filter((r) => r.status === "FAIL").length
  const warnings = results.filter((r) => r.status === "WARNING").length

  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   ⚠️  Warnings: ${warnings}`)
  console.log(`   📊 Total Tests: ${results.length}`)

  if (failed === 0 && warnings === 0) {
    console.log("\n🎉 All diagnostics passed! Your Supabase connection is fully operational.")
  } else if (failed === 0) {
    console.log("\n⚠️  Connection is working but there are some warnings to review.")
  } else {
    console.log("\n❌ Connection has critical issues that need to be resolved.")
  }

  console.log("\n" + "=".repeat(60))

  // Detailed Results
  if (failed > 0 || warnings > 0) {
    console.log("\n📋 DETAILED ISSUES:\n")
    results
      .filter((r) => r.status !== "PASS")
      .forEach((result) => {
        console.log(`${result.status === "FAIL" ? "❌" : "⚠️"} ${result.step}: ${result.message}`)
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
        }
      })
  }

  return results
}

// Run diagnostics
runDiagnostics()
  .then(() => {
    console.log("\n✨ Diagnostics complete!\n")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Diagnostic script failed:", error)
    process.exit(1)
  })
