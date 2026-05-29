"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, Home, Users } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userRole, setUserRole] = useState<"renter" | "host">("renter")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailCheckResult, setEmailCheckResult] = useState<{
    exists: boolean
    message: string
  } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const checkEmailExists = async (emailValue: string) => {
    setEmailCheckResult(null)

    if (!emailValue.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return
    }

    setIsCheckingEmail(true)

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailCheckResult({
          exists: data.exists,
          message: data.message,
        })

        if (data.exists) {
          setValidationErrors((prev) => ({
            ...prev,
            email: "This email is already registered. Please sign in instead.",
          }))
        } else {
          setValidationErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.email
            return newErrors
          })
        }
      }
    } catch (error) {
      console.error("[v0] Email check failed:", error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!firstName.trim()) {
      errors.firstName = "First name is required"
    } else if (firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters"
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required"
    } else if (lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters"
    }

    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address"
    } else if (emailCheckResult?.exists) {
      errors.email = "This email is already registered. Please sign in instead."
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = "Password must contain uppercase, lowercase, and number"
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setValidationErrors({})

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    if (!supabase) {
      setError("Authentication service unavailable. Please try again later.")
      setIsLoading(false)
      return
    }

    try {
      console.log("[v0] Starting registration process for:", email)
      console.log("[v0] Selected role:", userRole)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            display_name: `${firstName.trim()} ${lastName.trim()}`.trim() || email.split("@")[0],
            email: email.trim(),
            user_role: userRole,
          },
        },
      })

      let userId = data?.user?.id

      if (signUpError) {
        console.error("[v0] Supabase signUp error:", signUpError.message)

        if (
          signUpError.message?.toLowerCase().includes("email") ||
          signUpError.message?.toLowerCase().includes("confirmation")
        ) {
          console.log("[v0] Email error detected, checking if user was created...")

          if (data?.user?.id) {
            userId = data.user.id
            console.log("[v0] User was created with ID:", userId)
          } else {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            })

            if (signInData?.user?.id) {
              userId = signInData.user.id
              console.log("[v0] Found user via sign-in:", userId)
              await supabase.auth.signOut()
            }
          }
        } else {
          throw signUpError
        }
      }

      if (!userId) {
        throw new Error("Failed to create user account. Please try again.")
      }

      console.log("[v0] User created successfully:", userId)

      // IMPORTANT: Sign out immediately - user must verify email before logging in
      await supabase.auth.signOut()
      console.log("[v0] User signed out - must verify email before login")

      // Send verification email via Resend API (this also updates the profile on the server)
      try {
        console.log("[v0] Calling send-verification API...")
        
        const verifyResponse = await fetch("/api/resend/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            firstName: firstName.trim(),
            userId: userId,
            userRole: userRole,
          }),
        })

        const verifyResult = await verifyResponse.json()
        console.log("[v0] Send verification API response:", verifyResult)

        if (!verifyResponse.ok) {
          console.error("[v0] Send verification failed:", verifyResult)
          setError("Account created but verification email could not be sent. Please contact support.")
        } else {
          console.log("[v0] Verification email sent successfully!")
        }
      } catch (emailError) {
        console.error("[v0] Error calling send-verification API:", emailError)
        setError("Account created but verification email could not be sent. Please contact support.")
      }

      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email.trim())}`)
    } catch (error: unknown) {
      console.error("[v0] Registration failed:", error)

      if (error instanceof Error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          setError("An account with this email already exists. Please sign in instead.")
        } else if (error.message.includes("Invalid email")) {
          setError("Please enter a valid email address.")
        } else if (error.message.includes("Password")) {
          setError(
            "Password does not meet requirements. Please use at least 8 characters with uppercase, lowercase, and numbers.",
          )
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    switch (field) {
      case "firstName":
        setFirstName(value)
        break
      case "lastName":
        setLastName(value)
        break
      case "email":
        setEmail(value)
        if (value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          const timeoutId = setTimeout(() => checkEmailExists(value), 500)
          return () => clearTimeout(timeoutId)
        }
        break
      case "password":
        setPassword(value)
        break
      case "confirmPassword":
        setConfirmPassword(value)
        break
    }
  }

  const handleEmailBlur = () => {
    if (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      checkEmailExists(email)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Join SpaceOnGo to find and list amazing spaces</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-2">
                    <Label className="text-base font-semibold">I want to</Label>
                    <RadioGroup value={userRole} onValueChange={(value) => setUserRole(value as "renter" | "host")}>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="renter" id="renter" />
                        <Label htmlFor="renter" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Users className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Rent spaces</div>
                            <div className="text-xs text-gray-500">Find and book amazing spaces</div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                        <RadioGroupItem value="host" id="host" />
                        <Label htmlFor="host" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Home className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium">List my space</div>
                            <div className="text-xs text-gray-500">Share your space and earn money</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => handleFieldChange("firstName", e.target.value)}
                        className={validationErrors.firstName ? "border-red-500" : ""}
                        disabled={isLoading}
                      />
                      {validationErrors.firstName && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => handleFieldChange("lastName", e.target.value)}
                        className={validationErrors.lastName ? "border-red-500" : ""}
                        disabled={isLoading}
                      />
                      {validationErrors.lastName && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {validationErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        onBlur={handleEmailBlur}
                        className={validationErrors.email ? "border-red-500" : ""}
                        disabled={isLoading}
                      />
                      {isCheckingEmail && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      {!isCheckingEmail && emailCheckResult && !emailCheckResult.exists && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.email}
                      </p>
                    )}
                    {!validationErrors.email && emailCheckResult && !emailCheckResult.exists && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Email is available
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      className={validationErrors.password ? "border-red-500" : ""}
                      disabled={isLoading}
                    />
                    {validationErrors.password && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.password}
                      </p>
                    )}
                    {!validationErrors.password && (
                      <p className="text-xs text-gray-500">
                        Must be 8+ characters with uppercase, lowercase, and number
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                      className={validationErrors.confirmPassword ? "border-red-500" : ""}
                      disabled={isLoading}
                    />
                    {validationErrors.confirmPassword && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        Your profile will be automatically created with the information provided. You can update your
                        profile details anytime after registration.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || isCheckingEmail}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
