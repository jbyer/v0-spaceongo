/**
 * Health check endpoint for Supabase connection
 *
 * Access at: /api/health/supabase
 *
 * Returns JSON with connection status and details
 */

import { NextResponse } from "next/server"
import { testSupabaseConnection } from "@/lib/supabase/connection-test"

export async function GET() {
  try {
    const result = await testSupabaseConnection()

    return NextResponse.json(
      {
        status: result.success ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        service: "Supabase",
        ...result,
      },
      { status: result.success ? 200 : 503 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        service: "Supabase",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
