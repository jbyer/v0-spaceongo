/**
 * Supabase Connection Test Utility
 *
 * Use this in your application to verify Supabase connectivity
 * and diagnose connection issues.
 */

import { createClient } from "./client"

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: {
    envVarsPresent: boolean
    connectionEstablished: boolean
    databaseAccessible: boolean
    authSystemWorking: boolean
  }
  error?: string
}

/**
 * Tests the Supabase connection and returns detailed results
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  try {
    // Check environment variables
    const envVarsPresent = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (!envVarsPresent) {
      return {
        success: false,
        message: "Supabase environment variables are not configured",
        details: {
          envVarsPresent: false,
          connectionEstablished: false,
          databaseAccessible: false,
          authSystemWorking: false,
        },
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      }
    }

    // Create client
    const supabase = createClient()
    const connectionEstablished = !!supabase

    // Test database access
    const { data, error: dbError } = await supabase.from("space_categories").select("id").limit(1)

    const databaseAccessible = !dbError && data !== null

    // Test auth system
    const { error: authError } = await supabase.auth.getSession()
    const authSystemWorking = !authError

    const allTestsPassed = envVarsPresent && connectionEstablished && databaseAccessible && authSystemWorking

    return {
      success: allTestsPassed,
      message: allTestsPassed ? "Supabase connection is fully operational" : "Supabase connection has issues",
      details: {
        envVarsPresent,
        connectionEstablished,
        databaseAccessible,
        authSystemWorking,
      },
      error: dbError?.message || authError?.message,
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to test Supabase connection",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Quick connection check - returns true if Supabase is accessible
 */
export async function isSupabaseConnected(): Promise<boolean> {
  const result = await testSupabaseConnection()
  return result.success
}
