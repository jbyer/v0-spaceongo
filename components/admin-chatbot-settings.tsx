"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageSquare } from "lucide-react"

export function AdminChatbotSettings() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [model, setModel] = useState("openai/gpt-4o-mini")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const supabase = createClient()

      const { data: settings } = await supabase
        .from("chatbot_settings")
        .select("*")
        .in("setting_key", ["chatbot_enabled", "welcome_message", "model"])

      if (settings) {
        settings.forEach((setting) => {
          if (setting.setting_key === "chatbot_enabled") {
            setIsEnabled(setting.setting_value === "true")
          } else if (setting.setting_key === "welcome_message") {
            setWelcomeMessage(setting.setting_value)
          } else if (setting.setting_key === "model") {
            setModel(setting.setting_value)
          }
        })
      }
    } catch (error) {
      console.error("Error loading chatbot settings:", error)
      toast({
        title: "Error",
        description: "Failed to load chatbot settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()

      await supabase
        .from("chatbot_settings")
        .update({ setting_value: isEnabled.toString() })
        .eq("setting_key", "chatbot_enabled")

      await supabase
        .from("chatbot_settings")
        .update({ setting_value: welcomeMessage })
        .eq("setting_key", "welcome_message")

      await supabase.from("chatbot_settings").update({ setting_value: model }).eq("setting_key", "model")

      toast({
        title: "Success",
        description: "Chatbot settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving chatbot settings:", error)
      toast({
        title: "Error",
        description: "Failed to save chatbot settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chatbot Settings
        </CardTitle>
        <CardDescription>Configure the AI-powered chatbot assistant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Chatbot</Label>
            <p className="text-sm text-gray-500">Show the chatbot widget to all visitors</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>

        {/* Welcome Message */}
        <div className="space-y-2">
          <Label htmlFor="welcome-message">Welcome Message</Label>
          <Textarea
            id="welcome-message"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Enter the initial greeting message"
            rows={3}
          />
          <p className="text-xs text-gray-500">This message appears when users first open the chatbot</p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">AI Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</SelectItem>
              <SelectItem value="openai/gpt-4o">GPT-4o (Most Capable)</SelectItem>
              <SelectItem value="anthropic/claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Choose the AI model for chatbot responses</p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}
