"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Send,
  Paperclip,
  MessageCircle,
  Clock,
  CheckCheck,
  Filter,
  MoreVertical,
  X,
  File,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  message_type: string
  booking_id?: string
  is_read: boolean
  created_at: string
  sender_name: string
  sender_avatar?: string
  space_title?: string
}

interface Conversation {
  id: string
  participant_id: string
  participant_name: string
  participant_avatar?: string
  last_message: string
  last_message_time: string
  unread_count: number
  space_title?: string
  booking_id?: string
}

interface Attachment {
  id: string
  file: File
  preview?: string
  type: "image" | "file"
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [loading, setLoading] = useState(true)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMessagesAndConversations = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        setCurrentUserId(user.id)

        // Fetch all messages for the user
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey(id, first_name, last_name, profile_image_url),
            recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, profile_image_url)
          `,
          )
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order("created_at", { ascending: false })

        if (messagesError) {
          console.error("[v0] Error fetching messages:", messagesError)
          setLoading(false)
          return
        }

        // Transform messages data
        const transformedMessages: Message[] = (messagesData || []).map((msg: any) => {
          const isSender = msg.sender_id === user.id
          const otherUser = isSender ? msg.recipient : msg.sender

          return {
            id: msg.id,
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
            subject: msg.subject || "",
            content: msg.content,
            message_type: msg.message_type,
            booking_id: msg.booking_id,
            is_read: msg.is_read,
            created_at: msg.created_at,
            sender_name: isSender ? "You" : `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim(),
            sender_avatar: isSender ? user.user_metadata?.avatar_url : otherUser?.profile_image_url,
          }
        })

        setMessages(transformedMessages)

        // Group messages into conversations
        const conversationMap = new Map<string, Conversation>()

        transformedMessages.forEach((msg) => {
          // Determine the other participant
          const otherParticipantId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id

          if (!conversationMap.has(otherParticipantId)) {
            // Find the most recent message with this participant
            const isSender = msg.sender_id === user.id
            const otherUserData = messagesData?.find(
              (m: any) =>
                (m.sender_id === otherParticipantId || m.recipient_id === otherParticipantId) && m.id === msg.id,
            )

            const otherUser = isSender ? otherUserData?.recipient : otherUserData?.sender

            conversationMap.set(otherParticipantId, {
              id: otherParticipantId,
              participant_id: otherParticipantId,
              participant_name: `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim() || "Unknown User",
              participant_avatar: otherUser?.profile_image_url,
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: 0,
              space_title: msg.subject,
            })
          }

          // Count unread messages from this participant
          if (!msg.is_read && msg.recipient_id === user.id) {
            const conv = conversationMap.get(otherParticipantId)
            if (conv) {
              conv.unread_count++
            }
          }
        })

        setConversations(Array.from(conversationMap.values()))
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching conversations:", error)
        setLoading(false)
      }
    }

    fetchMessagesAndConversations()

    const supabase = createClient()
    const channel = supabase
      .channel("messages-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        console.log("[v0] Real-time message update:", payload)
        // Refetch messages when changes occur
        fetchMessagesAndConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    Array.from(files).forEach((file) => {
      // Validate file size
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        })
        return
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format`,
          variant: "destructive",
        })
        return
      }

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newAttachment: Attachment = {
            id: Date.now().toString() + Math.random(),
            file,
            preview: e.target?.result as string,
            type: "image",
          }
          setAttachments((prev) => [...prev, newAttachment])
        }
        reader.readAsDataURL(file)
      } else {
        const newAttachment: Attachment = {
          id: Date.now().toString() + Math.random(),
          file,
          type: "file",
        }
        setAttachments((prev) => [...prev, newAttachment])
      }
    })

    // Reset input
    event.target.value = ""
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || !currentUserId) return

    setIsUploading(true)

    try {
      const supabase = createClient()

      // Insert message into database
      const { data: messageData, error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedConversation,
          subject: "Reply",
          content: newMessage || `Sent ${attachments.length} attachment(s)`,
          message_type: "general",
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error sending message:", error)
        toast({
          title: "Failed to send",
          description: "There was an error sending your message. Please try again.",
          variant: "destructive",
        })
        setIsUploading(false)
        return
      }

      // Add message to local state
      const newMsg: Message = {
        id: messageData.id,
        sender_id: currentUserId,
        recipient_id: selectedConversation,
        subject: "Reply",
        content: newMessage || `Sent ${attachments.length} attachment(s)`,
        message_type: "general",
        is_read: false,
        created_at: new Date().toISOString(),
        sender_name: "You",
      }

      setMessages((prev) => [...prev, newMsg])
      setNewMessage("")
      setAttachments([])

      toast({
        title: "Message sent",
        description: "Your message has been delivered successfully",
      })
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast({
        title: "Failed to send",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.space_title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && conv.unread_count > 0) ||
      (filter === "read" && conv.unread_count === 0)
    return matchesSearch && matchesFilter
  })

  const conversationMessages = selectedConversation
    ? messages.filter(
        (msg) =>
          (msg.sender_id === currentUserId && msg.recipient_id === selectedConversation) ||
          (msg.sender_id === selectedConversation && msg.recipient_id === currentUserId),
      )
    : []

  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  const selectedConv = conversations.find((c) => c.id === selectedConversation)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <SiteHeader />
      <div className="flex">
        <DashboardSidebar activeTab="messages" />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 mt-1">Communicate with potential renters and manage inquiries</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                      <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                      <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCheck className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Messages</p>
                      <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages Interface */}
            <Card className="h-[600px]">
              <div className="flex h-full">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Conversations</CardTitle>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Search and Filter */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search conversations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="unread">Unread</TabsTrigger>
                          <TabsTrigger value="read">Read</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-900 mb-1">No conversations yet</p>
                        <p className="text-xs text-gray-500">Messages from inquiries will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                              selectedConversation === conversation.id
                                ? "bg-blue-50 border-l-blue-500"
                                : "border-l-transparent"
                            }`}
                            onClick={() => setSelectedConversation(conversation.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={conversation.participant_avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {conversation.participant_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {conversation.participant_name}
                                  </p>
                                  {conversation.unread_count > 0 && (
                                    <Badge variant="default" className="ml-2">
                                      {conversation.unread_count}
                                    </Badge>
                                  )}
                                </div>

                                {conversation.space_title && (
                                  <p className="text-xs text-gray-500 mb-1">{conversation.space_title}</p>
                                )}

                                <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>

                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Message Thread */}
                <div className="flex-1 flex flex-col">
                  {selectedConversation && selectedConv ? (
                    <>
                      {/* Thread Header */}
                      <CardHeader className="border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={selectedConv.participant_avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {selectedConv.participant_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-gray-900">{selectedConv.participant_name}</h3>
                              {selectedConv.space_title && (
                                <p className="text-sm text-gray-500">{selectedConv.space_title}</p>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      {/* Messages */}
                      <CardContent className="flex-1 overflow-y-auto p-4">
                        {conversationMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {conversationMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender_name === "You" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.sender_name === "You"
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      message.sender_name === "You" ? "text-blue-100" : "text-gray-500"
                                    }`}
                                  >
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>

                      {/* Message Input */}
                      <div className="border-t border-gray-200 p-4">
                        {attachments.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="relative group rounded-lg border border-gray-200 bg-gray-50 p-2 transition-colors hover:bg-gray-100"
                              >
                                {attachment.type === "image" && attachment.preview ? (
                                  <div className="relative">
                                    <img
                                      src={attachment.preview || "/placeholder.svg"}
                                      alt="Attachment preview"
                                      className="h-20 w-20 rounded object-cover"
                                    />
                                    <button
                                      onClick={() => removeAttachment(attachment.id)}
                                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                      aria-label="Remove attachment"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <File className="h-8 w-8 text-gray-400" />
                                    <div className="max-w-[120px]">
                                      <p className="text-xs font-medium text-gray-700 truncate">
                                        {attachment.file.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(attachment.file.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => removeAttachment(attachment.id)}
                                      className="rounded-full bg-red-500 p-1 text-white transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                      aria-label="Remove attachment"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <Textarea
                              placeholder="Type your message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              className="min-h-[60px] resize-none"
                              disabled={isUploading}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSendMessage()
                                }
                              }}
                              aria-label="Message text"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              title="Attach file (PDF, DOC, or image)"
                              aria-label="Attach file"
                            >
                              <Paperclip className="h-5 w-5" />
                            </Button>

                            <Button
                              onClick={handleSendMessage}
                              disabled={isUploading || (!newMessage.trim() && attachments.length === 0)}
                              className="h-9 px-4"
                              title="Send message (Enter)"
                              aria-label="Send message"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          Supports images, PDFs, and documents up to 10MB. Press Enter to send, Shift+Enter for new
                          line.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                        <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
      <SiteFooter />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,image/*"
        multiple
        onChange={handleFileSelect}
        aria-label="Select files to attach"
      />
    </div>
  )
}
