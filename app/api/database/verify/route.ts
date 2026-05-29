import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

/**
 * API endpoint to verify database connection
 * Access at: /api/database/verify
 */
export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
        databaseName: process.env.POSTGRES_DATABASE || "Not specified",
        databaseHost: process.env.POSTGRES_HOST || "Not specified",
      },
      connection: {
        status: "unknown",
        message: "",
        details: {},
      },
    }

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          ...diagnostics,
          connection: {
            status: "error",
            message: "Supabase environment variables are not configured",
            details: {
              missingVars: [
                !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
                !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
              ].filter(Boolean),
            },
          },
        },
        { status: 500 },
      )
    }

    // Verify database name
    const expectedDatabase = "spaceongo_v2"
    const actualDatabase = process.env.POSTGRES_DATABASE
    const databaseNameMatch = actualDatabase === expectedDatabase

    // Test connection
    const supabase = createClient()

    // Test database access
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("space_categories")
      .select("id, name")
      .limit(5)

    // Test auth system
    const { error: authError } = await supabase.auth.getSession()

    // Compile results
    const connectionWorking = !categoriesError && !authError

    diagnostics.connection = {
      status: connectionWorking ? "connected" : "error",
      message: connectionWorking ? `Successfully connected to database: ${actualDatabase}` : "Connection failed",
      details: {
        databaseName: {
          actual: actualDatabase,
          expected: expectedDatabase,
          match: databaseNameMatch,
          status: databaseNameMatch ? "✅ Correct" : "⚠️ Mismatch",
        },
        databaseAccess: {
          status: categoriesError ? "❌ Failed" : "✅ Working",
          error: categoriesError?.message,
          sampleData: categoriesData?.length || 0,
        },
        authSystem: {
          status: authError ? "❌ Failed" : "✅ Working",
          error: authError?.message,
        },
      },
    }

    return NextResponse.json(diagnostics, {
      status: connectionWorking ? 200 : 500,
    })
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        connection: {
          status: "error",
          message: "Failed to verify database connection",
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      },
      { status: 500 },
    )
  }
}
