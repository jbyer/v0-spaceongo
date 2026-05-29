"use client"

import React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import Link from "next/link"
import Loading from "./loading"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    verifyToken()
  }, [token, email])

  const verifyToken = async () => {
    if (!token || !email) {
      setError("Invalid or missing reset link. Please request a new password reset.")
      setIsVerifying(false)
      return
    }

    try {
      const response = await fetch("/api/resend/verify-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, verifyOnly: true }),
      })

      const data = await response.json()

      if (data.valid) {
        setTokenValid(true)
      } else {
        setError(data.error || "Invalid or expired reset link. Please request a new password reset.")
      }
    } catch (err) {
      setError("Failed to verify reset link. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const validatePassword = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter")
      return false
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter")
      return false
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validatePassword()) return

    setIsLoading(true)

    try {
      // First verify and consume the token
      const verifyResponse = await fetch("/api/resend/verify-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, verifyOnly: false }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyData.valid) {
        setError(verifyData.error || "Invalid or expired reset link.")
        return
      }

      // Sign in with the temporary session to update password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email!,
        password: verifyData.tempPassword,
      })

      if (signInError) {
        // Try updating password directly using admin method
        const updateResponse = await fetch("/api/auth/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token, newPassword: password }),
        })

        const updateData = await updateResponse.json()

        if (!updateResponse.ok) {
          setError(updateData.error || "Failed to update password")
          return
        }
      } else {
        // Update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })

        if (updateError) {
          setError(updateError.message || "Failed to update password")
          return
        }

        // Sign out after password update
        await supabase.auth.signOut()
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
              <p className="text-gray-600">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
            <CardDescription>Your password has been updated successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full bg-green-600 hover:bg-green-700">Sign in with new password</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button className="w-full bg-green-600 hover:bg-green-700">Request new reset link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/images/spaceongo-logo.png" alt="SpaceOnGo" width={180} height={48} className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl">Create new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="inline h-3 w-3 mr-1" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <Lock className="inline h-3 w-3 mr-1" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting password...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
