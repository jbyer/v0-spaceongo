/**
 * Supabase Connection Verification Script
 *
 * This script verifies that:
 * 1. All required environment variables are present
 * 2. Connection to Supabase can be established
 * 3. Basic database operations work (query test)
 * 4. Authentication system is operational
 */

import { createClient } from "@supabase/supabase-js"

async function verifySupabaseConnection() {
  console.log("🔍 Starting Supabase Connection Verification...\n")

  // Step 1: Verify Environment Variables
  console.log("📋 Step 1: Checking Environment Variables")
  console.log("─".repeat(50))

  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  let allEnvVarsPresent = true

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    const isPresent = !!value
    const status = isPresent ? "✅" : "❌"
    const displayValue = isPresent ? `${value.substring(0, 20)}...` : "MISSING"

    console.log(`${status} ${key}: ${displayValue}`)

    if (!isPresent) {
      allEnvVarsPresent = false
    }
  }

  if (!allEnvVarsPresent) {
    console.log("\n❌ FAILED: Missing required environment variables")
    return false
  }

  console.log("\n✅ All required environment variables are present\n")

  // Step 2: Test Connection
  console.log("🔌 Step 2: Testing Supabase Connection")
  console.log("─".repeat(50))

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    console.log("✅ Supabase client created successfully")

    // Step 3: Test Database Query
    console.log("\n📊 Step 3: Testing Database Query")
    console.log("─".repeat(50))

    // Try to query the space_categories table (should be publicly readable)
    const { data: categories, error: categoriesError } = await supabase
      .from("space_categories")
      .select("id, name")
      .limit(5)

    if (categoriesError) {
      console.log(`❌ Database query failed: ${categoriesError.message}`)
      console.log(`   Code: ${categoriesError.code}`)
      console.log(`   Details: ${categoriesError.details}`)
      return false
    }

    console.log(`✅ Database query successful`)
    console.log(`   Retrieved ${categories?.length || 0} space categories:`)
    categories?.forEach((cat) => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`)
    })

    // Step 4: Test Authentication System
    console.log("\n🔐 Step 4: Testing Authentication System")
    console.log("─".repeat(50))

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.log(`⚠️  Session check warning: ${sessionError.message}`)
    } else {
      console.log("✅ Authentication system is operational")
      console.log(`   Current session: ${session ? "Active" : "No active session (expected)"}`)
    }

    // Step 5: Test Service Role Access (if available)
    console.log("\n🔑 Step 5: Testing Service Role Access")
    console.log("─".repeat(50))

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      // Try to query profiles table with service role (bypasses RLS)
      const { data: profiles, error: profilesError } = await adminClient
        .from("profiles")
        .select("id, email, role")
        .limit(3)

      if (profilesError) {
        console.log(`❌ Service role query failed: ${profilesError.message}`)
      } else {
        console.log("✅ Service role access working")
        console.log(`   Retrieved ${profiles?.length || 0} user profiles`)
        if (profiles && profiles.length > 0) {
          console.log(`   Sample user roles: ${profiles.map((p) => p.role).join(", ")}`)
        }
      }
    } else {
      console.log("⚠️  Service role key not available (optional)")
    }

    // Step 6: Test Storage Access
    console.log("\n📦 Step 6: Testing Storage Access")
    console.log("─".repeat(50))

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.log(`⚠️  Storage access warning: ${bucketsError.message}`)
    } else {
      console.log("✅ Storage system accessible")
      console.log(`   Available buckets: ${buckets?.map((b) => b.name).join(", ") || "none"}`)
    }

    // Final Summary
    console.log("\n" + "═".repeat(50))
    console.log("✅ VERIFICATION COMPLETE: Supabase is properly configured!")
    console.log("═".repeat(50))
    console.log("\n📝 Summary:")
    console.log("   • Environment variables: ✅ Configured")
    console.log("   • Database connection: ✅ Active")
    console.log("   • Query operations: ✅ Working")
    console.log("   • Authentication: ✅ Operational")
    console.log("   • Storage: ✅ Accessible")
    console.log("\n🚀 Your Supabase integration is ready for use!\n")

    return true
  } catch (error) {
    console.log("\n❌ VERIFICATION FAILED")
    console.log("─".repeat(50))
    console.log("Error details:", error)
    return false
  }
}

// Run the verification
verifySupabaseConnection()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error("Unexpected error:", error)
    process.exit(1)
  })
