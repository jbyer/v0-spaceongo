"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, ExternalLink, AlertCircle, CheckCircle } from "lucide-react"

interface VideoLinkInputProps {
  videoLink: string
  onVideoLinkChange: (link: string) => void
}

export default function VideoLinkInput({ videoLink, onVideoLinkChange }: VideoLinkInputProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | null>(null)

  const validateVideoLink = (url: string) => {
    if (!url) {
      setValidationStatus(null)
      return
    }

    setIsValidating(true)

    // Simple validation for YouTube and Vimeo URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/

    setTimeout(() => {
      if (youtubeRegex.test(url) || vimeoRegex.test(url)) {
        setValidationStatus("valid")
      } else {
        setValidationStatus("invalid")
      }
      setIsValidating(false)
    }, 1000)
  }

  const handleInputChange = (value: string) => {
    onVideoLinkChange(value)
    validateVideoLink(value)
  }

  const getVideoThumbnail = (url: string) => {
    // Extract YouTube video ID
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
    }

    // For Vimeo, we'd need to make an API call, so we'll just show a placeholder
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return "/placeholder.svg?height=200&width=300&text=Vimeo+Video"
    }

    return null
  }

  const thumbnail = validationStatus === "valid" ? getVideoThumbnail(videoLink) : null

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2 flex items-center">
          <Video className="h-4 w-4 mr-2" />
          Video Tour (Optional)
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Add a YouTube or Vimeo video to showcase your space. Video tours can increase bookings by up to 40%.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="videoLink">Video URL</Label>
          <div className="relative mt-1">
            <Input
              id="videoLink"
              placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
              value={videoLink}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`pr-10 ${
                validationStatus === "valid"
                  ? "border-green-500"
                  : validationStatus === "invalid"
                    ? "border-red-500"
                    : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidating && (
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              )}
              {validationStatus === "valid" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {validationStatus === "invalid" && <AlertCircle className="h-4 w-4 text-red-500" />}
            </div>
          </div>
        </div>

        {validationStatus === "invalid" && (
          <p className="text-sm text-red-600">Please enter a valid YouTube or Vimeo URL</p>
        )}

        {validationStatus === "valid" && <p className="text-sm text-green-600">Video link validated successfully!</p>}
      </div>

      {/* Video Preview */}
      {thumbnail && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium">Video Preview</h5>
              <Button variant="outline" size="sm" onClick={() => window.open(videoLink, "_blank")}>
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img src={thumbnail || "/placeholder.svg"} alt="Video thumbnail" className="w-full h-full object-cover" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h5 className="font-medium text-blue-900 mb-2">Video Tips</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep videos under 2 minutes for best engagement</li>
            <li>• Show the space from multiple angles</li>
            <li>• Highlight unique features and amenities</li>
            <li>• Ensure good lighting and stable footage</li>
            <li>• Include a brief introduction about the space</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
