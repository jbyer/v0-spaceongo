import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This API route fetches public-facing admin settings using the service role
// to bypass RLS policies that restrict access to admin-only users

// Disable caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Only fetch specific public-facing settings
    const publicSettingKeys = [
      "featured_spaces_visible",
      "featured_spaces_count",
    ]

    const { data, error } = await supabaseAdmin
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", publicSettingKeys)

    if (error) {
      console.error("[v0] Error fetching public settings:", error)
      return NextResponse.json(
        { error: "Failed to fetch settings" }, 
        { 
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          }
        }
      )
    }

    // Convert array to object for easier consumption
    const settings: Record<string, string> = {}
    data?.forEach((item) => {
      settings[item.setting_key] = item.setting_value
    })

    return NextResponse.json(
      { settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      }
    )
  } catch (error) {
    console.error("[v0] Error in public settings API:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }
      }
    )
  }
}
