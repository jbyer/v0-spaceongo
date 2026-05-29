import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const SYSTEM_PROMPT = `You are SpaceBot, a helpful AI assistant for SpaceOnGo - a platform for finding and booking flexible coworking, office, and event spaces. 

Key information about SpaceOnGo:
- Users can browse and book offices, conference rooms, studios, storage spaces, and event spaces
- No lease required, no hassle, no upfront costs
- Hosts can list their spaces and earn income
- Renters can find flexible space solutions
- Features include: real-time availability, secure payments via Stripe, messaging between hosts and renters, favorites/bookings management

Common user questions you should help with:
1. How to find and book a space
2. How to list a space as a host
3. Pricing and payment information
4. Cancellation policies
5. Account management
6. Features and benefits

Be friendly, concise, and helpful. If you don't know something specific, direct users to contact support at support@spaceongo.com or visit the Help page.`

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json()

    const supabase = await createClient()

    // Check if chatbot is enabled
    const { data: settings } = await supabase
      .from("chatbot_settings")
      .select("setting_value")
      .eq("setting_key", "chatbot_enabled")
      .maybeSingle()

    if (settings?.setting_value !== "true") {
      return new Response(JSON.stringify({ error: "Chatbot is currently disabled" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get current user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get model from settings
    const { data: modelSettings } = await supabase
      .from("chatbot_settings")
      .select("setting_value")
      .eq("setting_key", "model")
      .maybeSingle()

    const modelSetting = modelSettings?.setting_value || "claude-sonnet-4-20250514"
    const modelId = modelSetting.replace("anthropic/", "")

    // Store conversation if new
    if (sessionId && messages.length === 1) {
      await supabase
        .from("chatbot_conversations")
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
        })
        .select()
        .maybeSingle()
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }))

    // Call Anthropic API directly with streaming
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    // Create a TransformStream to convert Anthropic SSE to AI SDK format
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    let fullText = ""

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk)
        const lines = text.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue
            
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                fullText += parsed.delta.text
                // Send in AI SDK UIMessage format
                const aiChunk = {
                  type: "text-delta",
                  textDelta: parsed.delta.text,
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(aiChunk)}\n\n`))
              }
              
              if (parsed.type === "message_stop") {
                // Send finish message
                const finishChunk = {
                  type: "finish",
                  finishReason: "stop",
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finishChunk)}\n\n`))
                
                // Store in database
                if (sessionId) {
                  const { data: conversation } = await supabase
                    .from("chatbot_conversations")
                    .select("id")
                    .eq("session_id", sessionId)
                    .maybeSingle()

                  if (conversation) {
                    const userMessage = messages[messages.length - 1]
                    await supabase.from("chatbot_messages").insert([
                      { conversation_id: conversation.id, role: "user", content: userMessage.content },
                      { conversation_id: conversation.id, role: "assistant", content: fullText },
                    ])
                  }
                }
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
    })

    // Pipe Anthropic response through transform
    const stream = response.body?.pipeThrough(transformStream)

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
