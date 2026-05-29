import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch messages for the current user
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(first_name, last_name, profile_image_url),
        recipient:profiles!messages_recipient_id_fkey(first_name, last_name, profile_image_url),
        booking:bookings(
          space:spaces(title)
        )
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Messages API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, subject, content, message_type, booking_id } = body

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id,
        subject,
        content,
        message_type: message_type || "message",
        booking_id,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Messages API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
