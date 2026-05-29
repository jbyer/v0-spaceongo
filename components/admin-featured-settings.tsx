"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminFeaturedSettings() {
  const [featuredSpacesCount, setFeaturedSpacesCount] = useState(6)
  const [isVisible, setIsVisible] = useState(true)
  const [initialVisible, setInitialVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("admin_settings")
          .select("*")
          .in("setting_key", ["featured_spaces_count", "featured_spaces_visible"])

        if (error) throw error

        if (data) {
          data.forEach((setting) => {
            if (setting.setting_key === "featured_spaces_count") {
              setFeaturedSpacesCount(Number.parseInt(setting.setting_value))
            } else if (setting.setting_key === "featured_spaces_visible") {
              const visible = setting.setting_value === "true"
              setIsVisible(visible)
              setInitialVisible(visible)
            }
          })
        }
      } catch (err) {
        console.error("Error loading admin settings:", err)
        setError("Failed to load settings. Using default values.")
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name")
        .eq("id", user.id)
        .single()

      const username =
        profile?.display_name ||
        `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
        user.email ||
        "Admin"

      const { error: countError } = await supabase.from("admin_settings").upsert(
        {
          setting_key: "featured_spaces_count",
          setting_value: featuredSpacesCount.toString(),
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      )

      if (countError) throw countError

      const { error: visibilityError } = await supabase.from("admin_settings").upsert(
        {
          setting_key: "featured_spaces_visible",
          setting_value: isVisible.toString(),
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "setting_key" },
      )

      if (visibilityError) throw visibilityError

      if (isVisible !== initialVisible) {
        const { error: activityError } = await supabase.from("user_activities").insert({
          user_id: user.id,
          username: username,
          activity_type: "featured_spaces_toggle",
          activity_description: isVisible
            ? "Featured Spaces section has been enabled on the homepage"
            : "Featured Spaces section has been disabled on the homepage",
          is_admin_action: true,
          metadata: { status: isVisible ? "enabled" : "disabled" },
        })

        if (activityError) {
          console.error("Error creating activity log:", activityError)
          // Don't throw here to avoid failing the whole save if logging fails
        }

        // Update initial state
        setInitialVisible(isVisible)
      }

      // Trigger custom events to notify components
      window.dispatchEvent(
        new CustomEvent("featuredSpacesCountChanged", {
          detail: { count: featuredSpacesCount },
        }),
      )

      window.dispatchEvent(
        new CustomEvent("featuredSpacesVisibilityChanged", {
          detail: { visible: isVisible },
        }),
      )

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving featured spaces settings:", err)
      setError("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCountChange = (value: string) => {
    const count = Number.parseInt(value)
    if (!isNaN(count) && count >= 1 && count <= 12) {
      setFeaturedSpacesCount(count)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Featured Spaces Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Featured Spaces Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex-1 space-y-1">
            <Label htmlFor="visibility-toggle" className="text-base font-medium">
              Show Featured Spaces Section
            </Label>
            <p className="text-sm text-gray-600">Toggle to show or hide the Featured Spaces section on the homepage</p>
          </div>
          <Switch
            id="visibility-toggle"
            checked={isVisible}
            onCheckedChange={setIsVisible}
            aria-label="Toggle featured spaces visibility"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="featuredCount">Number of Featured Spaces to Display</Label>
          <Input
            id="featuredCount"
            type="number"
            min="1"
            max="12"
            value={featuredSpacesCount}
            onChange={(e) => handleCountChange(e.target.value)}
            className="w-32"
            disabled={!isVisible}
          />
          <p className="text-sm text-gray-600">
            Set how many featured spaces appear on the homepage (1-12 spaces)
            {!isVisible && " - Disabled while section is hidden"}
          </p>
        </div>

        {showSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Featured spaces settings updated successfully! Changes are now live on the homepage.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
