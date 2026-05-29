"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import React from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! I'm SpaceBot, your AI assistant. How can I help you today?")
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [streamingContent, setStreamingContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const supabase = createClient()

        const { data: enabledSetting, error: enabledError } = await supabase
          .from("chatbot_settings")
          .select("setting_value")
          .eq("setting_key", "chatbot_enabled")
          .maybeSingle()

        if (enabledError) {
          setSettingsError(
            "Database tables not found. Please run the migration script: scripts/011_create_chatbot_tables.sql",
          )
        } else if (enabledSetting) {
          setIsEnabled(enabledSetting.setting_value === "true")
        }

        const { data: welcomeSetting } = await supabase
          .from("chatbot_settings")
          .select("setting_value")
          .eq("setting_key", "welcome_message")
          .maybeSingle()

        if (welcomeSetting) {
          setWelcomeMessage(welcomeSetting.setting_value)
        }
      } catch (error) {
        setSettingsError("Failed to load chatbot settings. Using defaults.")
      }
    }

    checkSettings()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return

    setError(null)
    setIsLoading(true)
    setStreamingContent("")

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullContent = ""
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "text-delta" && parsed.textDelta) {
                fullContent += parsed.textDelta
                setStreamingContent(fullContent)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add assistant message
      if (fullContent) {
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fullContent,
        }
        setMessages((prev) => [...prev, assistantMsg])
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
      setStreamingContent("")
    }
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    const messageContent = input.trim()
    setInput("")
    await sendMessage(messageContent)
  }

  if (!isEnabled) {
    return null
  }

  if (error) {
    return (
      <div className="fixed bottom-6 right-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-sm">
        <p className="text-sm font-semibold text-red-800 mb-2">Chatbot Error</p>
        <p className="text-xs text-red-600">{error.message}</p>
        <p className="text-xs text-red-500 mt-2">Please refresh the page or contact support.</p>
      </div>
    )
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg z-50"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-white">
                <AvatarFallback className="bg-white text-blue-600 font-semibold">SB</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">SpaceBot</h3>
                <p className="text-xs text-blue-100">AI Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
              aria-label="Close chatbot"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {settingsError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">{settingsError}</p>
              </div>
            )}

            {/* Welcome message */}
            {messages?.length === 0 && welcomeMessage && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 flex-shrink-0">
                  <AvatarFallback className="text-white text-xs">SB</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm max-w-[80%]">
                  <p className="text-sm text-gray-800">{welcomeMessage}</p>
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages?.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 flex-shrink-0">
                    <AvatarFallback className="text-white text-xs">SB</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 shadow-sm max-w-[80%] ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 bg-gray-300 flex-shrink-0">
                    <AvatarFallback className="text-gray-600 text-xs">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Streaming response */}
            {isLoading && streamingContent && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 flex-shrink-0">
                  <AvatarFallback className="text-white text-xs">SB</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm max-w-[80%]">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{streamingContent}</p>
                </div>
              </div>
            )}

            {/* Loading indicator (before any content arrives) */}
            {isLoading && !streamingContent && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 flex-shrink-0">
                  <AvatarFallback className="text-white text-xs">SB</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">Error: {error.message}</p>
                <p className="text-xs text-red-500 mt-1">Please try again or contact support if the issue persists.</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t bg-white"
          >
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input?.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  )
}
