"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function trackSpaceView(spaceId: string) {
  try {
    const supabase = await createClient()
    const headersList = await headers()

    // Get current user (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get request metadata
    const userAgent = headersList.get("user-agent") || "unknown"
    const referrer = headersList.get("referer") || headersList.get("referrer") || null

    // Determine device type from user agent
    const deviceType = getDeviceType(userAgent)

    // If user is authenticated, verify their profile exists before tracking
    let verifiedUserId: string | null = null
    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

      // Only set viewer_id if profile exists, otherwise treat as anonymous
      if (profile) {
        verifiedUserId = user.id
      }
    }

    // Generate a session ID if user is not authenticated
    const sessionId = verifiedUserId || generateSessionId()

    // Check if this user/session has already viewed this space recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    let recentViewQuery = supabase
      .from("space_views")
      .select("id")
      .eq("space_id", spaceId)
      .gte("viewed_at", oneHourAgo)
      .limit(1)

    // Add user or session filter based on authentication status
    if (verifiedUserId) {
      recentViewQuery = recentViewQuery.eq("viewer_id", verifiedUserId)
    } else {
      recentViewQuery = recentViewQuery.eq("session_id", sessionId)
    }

    const { data: recentView } = await recentViewQuery.maybeSingle()

    // If there's a recent view, don't track again (prevent duplicate counting)
    if (recentView) {
      console.log("[v0] Recent view found, skipping duplicate tracking")
      return { success: true, duplicate: true }
    }

    // Insert view record
    const { error } = await supabase.from("space_views").insert({
      space_id: spaceId,
      viewer_id: verifiedUserId || null,
      session_id: sessionId,
      user_agent: userAgent,
      referrer: referrer,
      device_type: deviceType,
    })

    if (error) {
      console.error("[v0] Error tracking space view:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Space view tracked successfully")
    return { success: true, duplicate: false }
  } catch (error: any) {
    console.error("[v0] Error in trackSpaceView:", error)
    return { success: false, error: error.message }
  }
}

function getDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" | "unknown" {
  const ua = userAgent.toLowerCase()

  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "mobile"
  }

  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet"
  }

  if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) {
    return "desktop"
  }

  return "unknown"
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export async function getSpaceViewStats(spaceId: string) {
  try {
    const supabase = await createClient()

    // Get total views
    const { data: space } = await supabase.from("spaces").select("view_count").eq("id", spaceId).single()

    // Get views by device type
    const { data: deviceStats } = await supabase.from("space_views").select("device_type").eq("space_id", spaceId)

    const deviceBreakdown = deviceStats?.reduce(
      (acc, view) => {
        acc[view.device_type] = (acc[view.device_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Get views over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentViews } = await supabase
      .from("space_views")
      .select("viewed_at")
      .eq("space_id", spaceId)
      .gte("viewed_at", thirtyDaysAgo)
      .order("viewed_at", { ascending: true })

    return {
      totalViews: space?.view_count || 0,
      deviceBreakdown: deviceBreakdown || {},
      recentViews: recentViews || [],
    }
  } catch (error: any) {
    console.error("[v0] Error getting space view stats:", error)
    return {
      totalViews: 0,
      deviceBreakdown: {},
      recentViews: [],
    }
  }
}
