"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, RotateCcw, CheckCircle, AlertCircle } from "lucide-react"

export default function AdminAllSpacesSettings() {
  const [displayCount, setDisplayCount] = useState(12)
  const [tempDisplayCount, setTempDisplayCount] = useState(12)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Load current settings on component mount
  useEffect(() => {
    const savedCount = localStorage.getItem("allSpacesDisplayCount")
    if (savedCount) {
      const count = Number.parseInt(savedCount, 10)
      setDisplayCount(count)
      setTempDisplayCount(count)
    }
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Validate input
      if (tempDisplayCount < 1 || tempDisplayCount > 50) {
        throw new Error("Display count must be between 1 and 50")
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem("allSpacesDisplayCount", tempDisplayCount.toString())
      setDisplayCount(tempDisplayCount)

      // Dispatch custom event to notify All Spaces page of changes
      window.dispatchEvent(
        new CustomEvent("allSpacesSettingsChanged", {
          detail: { displayCount: tempDisplayCount },
        }),
      )

      setMessage({ type: "success", text: "All Spaces display settings saved successfully!" })

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error saving All Spaces settings:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save settings",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setTempDisplayCount(12) // Reset to default
    setMessage(null)
  }

  const hasChanges = tempDisplayCount !== displayCount

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">All Spaces Display Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Display Configuration
          </CardTitle>
          <CardDescription>
            Control how many spaces are displayed on the All Spaces page. Changes will be reflected immediately for all
            visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Count Setting */}
          <div className="space-y-2">
            <Label htmlFor="displayCount" className="text-sm font-medium">
              Number of Spaces to Display
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="displayCount"
                type="number"
                min="1"
                max="50"
                value={tempDisplayCount}
                onChange={(e) => setTempDisplayCount(Number.parseInt(e.target.value, 10) || 1)}
                className="w-32"
                placeholder="12"
              />
              <span className="text-sm text-gray-600">spaces per page (1-50)</span>
            </div>
            <p className="text-xs text-gray-500">
              This controls the initial number of spaces shown on the All Spaces page. Users can still load more spaces
              using pagination.
            </p>
          </div>

          {/* Current Settings Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Settings</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Display Count: {displayCount} spaces</p>
              <p>Status: Active and applied to All Spaces page</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={!hasChanges || isLoading} className="flex items-center gap-2">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>

            <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isLoading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>

            {hasChanges && (
              <span className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Unsaved changes
              </span>
            )}
          </div>

          {/* Success/Error Messages */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Recommended Range:</strong> 8-20 spaces for optimal user experience and page load performance.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Performance Impact:</strong> Higher numbers may increase page load time but reduce pagination
                clicks.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Real-time Updates:</strong> Changes are applied immediately without requiring page refresh.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
