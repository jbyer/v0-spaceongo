"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface ForgotPasswordPopupProps {
  isOpen: boolean
  onClose: () => void
  onBackToLogin: () => void
}

export default function ForgotPasswordPopup({ isOpen, onClose, onBackToLogin }: ForgotPasswordPopupProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      // Send password reset email via Resend
      const response = await fetch("/api/resend/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If Resend fails, fall back to Supabase
        if (data.fallback === "supabase") {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
          })

          if (resetError) {
            console.error("[v0] Supabase password reset error:", resetError)
            setError(resetError.message || "Failed to send reset email. Please try again.")
            return
          }
        } else {
          setError(data.error || "Failed to send reset email. Please try again.")
          return
        }
      }

      setIsSubmitted(true)
    } catch (error: any) {
      console.error("[v0] Password reset failed:", error)
      setError(error.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setError("")
    setIsSubmitted(false)
    onClose()
  }

  const handleBackToLogin = () => {
    setEmail("")
    setError("")
    setIsSubmitted(false)
    onBackToLogin()
  }

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 text-center">Check your email</DialogTitle>
            <p className="text-gray-600 text-center">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">What's next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the reset link in the email</li>
                <li>• Create a new password</li>
                <li>• Sign in with your new password</li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Didn't receive the email?{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  Try again
                </button>
              </p>

              <button
                onClick={handleBackToLogin}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center">
            <Image src="/images/spaceongo-logo.png" alt="SpaceOnGo" width={180} height={48} className="h-10 w-auto" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Reset your password</DialogTitle>
          <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-sm font-semibold">
              <Mail className="inline h-3 w-3 mr-1" />
              Email address
            </Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
