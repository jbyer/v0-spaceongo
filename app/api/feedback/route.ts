import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { type, message, page } = body

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    if (type === "positive") {
      const { error } = await serviceSupabase.from("messages").insert({
        sender_id: user?.id || null,
        recipient_id: null,
        subject: `Positive Feedback: ${page || "Unknown Page"}`,
        content: "User found this page helpful",
        message_type: "feedback",
        is_read: false,
      })

      if (error) {
        console.error("[v0] Error recording positive feedback:", error)
        return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Positive feedback recorded",
      })
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: "Message is too long (max 500 characters)" }, { status: 400 })
    }

    const { data: adminProfile, error: adminError } = await serviceSupabase
      .from("profiles")
      .select("id")
      .eq("is_superuser", true)
      .maybeSingle()

    let recipientId = adminProfile?.id

    if (!recipientId) {
      const { data: hostProfile } = await serviceSupabase
        .from("profiles")
        .select("id")
        .eq("is_host", true)
        .limit(1)
        .maybeSingle()

      recipientId = hostProfile?.id
    }

    const { data: feedbackMessage, error } = await serviceSupabase
      .from("messages")
      .insert({
        sender_id: user?.id || null,
        recipient_id: recipientId || null,
        subject: `Help Page Feedback: ${page || "Unknown"}`,
        content: message,
        message_type: "feedback",
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating feedback message:", error)
      return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Feedback sent successfully",
      messageId: feedbackMessage.id,
    })
  } catch (error) {
    console.error("[v0] Feedback API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
