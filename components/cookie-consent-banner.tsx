"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import Link from "next/link"

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-consent", "all")
    window.dispatchEvent(new Event("cookie-consent-updated"))
    setShowBanner(false)
  }

  const handleAcceptEssential = () => {
    localStorage.setItem("cookie-consent", "essential")
    window.dispatchEvent(new Event("cookie-consent-updated"))
    setShowBanner(false)
  }

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "none")
    window.dispatchEvent(new Event("cookie-consent-updated"))
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-4xl mx-auto p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Cookie Preferences</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
              By clicking "Accept All", you consent to our use of cookies.{" "}
              <Link href="/cookies" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAcceptAll} size="sm" className="bg-green-600 hover:bg-green-700">
                Accept All
              </Button>
              <Button onClick={handleAcceptEssential} size="sm" variant="outline">
                Essential Only
              </Button>
              <Button onClick={handleReject} size="sm" variant="ghost">
                Reject All
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReject}
            className="flex-shrink-0"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
