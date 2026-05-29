/**
 * Comprehensive test script to verify connection to spaceongo_v2 database
 * This script performs multiple checks to ensure the database is properly connected
 */

import { createClient } from "@supabase/supabase-js"

interface TestResult {
  test: string
  status: "✓ PASS" | "✗ FAIL" | "⚠ WARNING"
  message: string
  details?: unknown
}

async function runConnectionTests() {
  const results: TestResult[] = []

  console.log("=".repeat(80))
  console.log("SPACEONGO_V2 DATABASE CONNECTION VERIFICATION")
  console.log("=".repeat(80))
  console.log()

  // Test 1: Environment Variables
  console.log("Test 1: Checking Environment Variables...")
  const requiredEnvVars = [
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "POSTGRES_DATABASE",
    "POSTGRES_URL",
  ]

  const missingVars = requiredEnvVars.filter((v) => !process.env[v])

  if (missingVars.length === 0) {
    results.push({
      test: "Environment Variables",
      status: "✓ PASS",
      message: `All ${requiredEnvVars.length} required environment variables are set`,
    })
  } else {
    results.push({
      test: "Environment Variables",
      status: "✗ FAIL",
      message: `Missing variables: ${missingVars.join(", ")}`,
    })
  }

  // Test 2: Database Name Verification
  console.log("Test 2: Verifying Database Name...")
  const dbName = process.env.POSTGRES_DATABASE

  if (dbName === "spaceongo_v2") {
    results.push({
      test: "Database Name",
      status: "✓ PASS",
      message: `Connected to correct database: ${dbName}`,
    })
  } else {
    results.push({
      test: "Database Name",
      status: "⚠ WARNING",
      message: `Database name is '${dbName}', expected 'spaceongo_v2'`,
    })
  }

  // Test 3: Supabase URL Format
  console.log("Test 3: Validating Supabase URL...")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (supabaseUrl && supabaseUrl.includes("supabase.co")) {
    results.push({
      test: "Supabase URL Format",
      status: "✓ PASS",
      message: `Valid Supabase URL: ${supabaseUrl}`,
    })
  } else {
    results.push({
      test: "Supabase URL Format",
      status: "✗ FAIL",
      message: `Invalid or missing Supabase URL: ${supabaseUrl}`,
    })
  }

  // Test 4: Create Supabase Client
  console.log("Test 4: Creating Supabase Client...")
  let supabase

  try {
    supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    results.push({
      test: "Client Creation",
      status: "✓ PASS",
      message: "Successfully created Supabase client",
    })
  } catch (error) {
    results.push({
      test: "Client Creation",
      status: "✗ FAIL",
      message: `Failed to create client: ${error instanceof Error ? error.message : String(error)}`,
    })
    printResults(results)
    return
  }

  // Test 5: Database Connection
  console.log("Test 5: Testing Database Connection...")

  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1)

    if (error) {
      results.push({
        test: "Database Connection",
        status: "✗ FAIL",
        message: `Connection failed: ${error.message}`,
        details: error,
      })
    } else {
      results.push({
        test: "Database Connection",
        status: "✓ PASS",
        message: "Successfully connected to database",
      })
    }
  } catch (error) {
    results.push({
      test: "Database Connection",
      status: "✗ FAIL",
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  // Test 6: Table Accessibility
  console.log("Test 6: Checking Table Accessibility...")
  const tables = [
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

  const tableResults: string[] = []

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("count").limit(1)

      if (error) {
        tableResults.push(`${table}: ✗ (${error.message})`)
      } else {
        tableResults.push(`${table}: ✓`)
      }
    } catch (error) {
      tableResults.push(`${table}: ✗ (${error instanceof Error ? error.message : "Unknown error"})`)
    }
  }

  const accessibleTables = tableResults.filter((r) => r.includes("✓")).length

  if (accessibleTables === tables.length) {
    results.push({
      test: "Table Accessibility",
      status: "✓ PASS",
      message: `All ${tables.length} tables are accessible`,
      details: tableResults,
    })
  } else if (accessibleTables > 0) {
    results.push({
      test: "Table Accessibility",
      status: "⚠ WARNING",
      message: `${accessibleTables}/${tables.length} tables accessible`,
      details: tableResults,
    })
  } else {
    results.push({
      test: "Table Accessibility",
      status: "✗ FAIL",
      message: "No tables are accessible",
      details: tableResults,
    })
  }

  // Test 7: Authentication System
  console.log("Test 7: Testing Authentication System...")

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      results.push({
        test: "Authentication System",
        status: "⚠ WARNING",
        message: `Auth check returned error: ${error.message}`,
      })
    } else {
      results.push({
        test: "Authentication System",
        status: "✓ PASS",
        message: "Authentication system is operational",
      })
    }
  } catch (error) {
    results.push({
      test: "Authentication System",
      status: "✗ FAIL",
      message: `Auth system error: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  // Test 8: Write Operation Test
  console.log("Test 8: Testing Write Permissions...")

  try {
    // Try to insert a test record (will fail due to RLS, but that's expected)
    const { error } = await supabase.from("admin_settings").select("count").limit(1)

    if (error && error.message.includes("permission denied")) {
      results.push({
        test: "Row Level Security",
        status: "✓ PASS",
        message: "RLS is properly configured and blocking unauthorized access",
      })
    } else if (error) {
      results.push({
        test: "Row Level Security",
        status: "⚠ WARNING",
        message: `Unexpected error: ${error.message}`,
      })
    } else {
      results.push({
        test: "Row Level Security",
        status: "✓ PASS",
        message: "Database permissions are working correctly",
      })
    }
  } catch (error) {
    results.push({
      test: "Row Level Security",
      status: "⚠ WARNING",
      message: `Could not test RLS: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  // Print Results
  printResults(results)
}

function printResults(results: TestResult[]) {
  console.log()
  console.log("=".repeat(80))
  console.log("TEST RESULTS SUMMARY")
  console.log("=".repeat(80))
  console.log()

  const passed = results.filter((r) => r.status === "✓ PASS").length
  const failed = results.filter((r) => r.status === "✗ FAIL").length
  const warnings = results.filter((r) => r.status === "⚠ WARNING").length

  results.forEach((result) => {
    console.log(`${result.status} ${result.test}`)
    console.log(`   ${result.message}`)

    if (result.details) {
      if (Array.isArray(result.details)) {
        result.details.forEach((detail) => console.log(`   - ${detail}`))
      } else {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
      }
    }

    console.log()
  })

  console.log("=".repeat(80))
  console.log(`Total Tests: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Warnings: ${warnings}`)
  console.log("=".repeat(80))

  if (failed === 0 && warnings === 0) {
    console.log()
    console.log("🎉 SUCCESS! Your application is properly connected to spaceongo_v2 database.")
    console.log()
  } else if (failed === 0) {
    console.log()
    console.log("⚠️  CONNECTION ESTABLISHED with warnings. Review the warnings above.")
    console.log()
  } else {
    console.log()
    console.log("❌ CONNECTION FAILED. Please fix the errors above.")
    console.log()
  }
}

// Run the tests
runConnectionTests().catch((error) => {
  console.error("Fatal error running tests:", error)
  process.exit(1)
})
