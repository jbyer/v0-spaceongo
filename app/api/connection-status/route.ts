import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Test 1: Check database connection
    const { data: profileCount, error: profileError } = await supabase.from("profiles").select("count").limit(1)

    // Test 2: Check auth system
    const { data: authData, error: authError } = await supabase.auth.getSession()

    // Test 3: Check multiple tables
    const tables = ["spaces", "bookings", "reviews", "space_categories"]
    const tableStatus: Record<string, boolean> = {}

    for (const table of tables) {
      const { error } = await supabase.from(table).select("count").limit(1)
      tableStatus[table] = !error
    }

    const allTablesAccessible = Object.values(tableStatus).every((status) => status)

    return NextResponse.json({
      status: "connected",
      database: process.env.POSTGRES_DATABASE || "unknown",
      timestamp: new Date().toISOString(),
      checks: {
        databaseConnection: !profileError,
        authSystem: !authError,
        tablesAccessible: allTablesAccessible,
        tableStatus,
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        databaseName: process.env.POSTGRES_DATABASE,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      errors: {
        profile: profileError?.message,
        auth: authError?.message,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
