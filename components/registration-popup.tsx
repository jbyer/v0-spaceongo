"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Users, Home } from "lucide-react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
  userRole: "renter" | "host"
}

interface ValidationError {
  field: string
  message: string
}

interface RegistrationPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultRole?: "renter" | "host"
  redirectUrl?: string
}

export default function RegistrationPopup({ isOpen, onClose, onSuccess, defaultRole = "renter", redirectUrl }: RegistrationPopupProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    userRole: defaultRole,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailCheckResult, setEmailCheckResult] = useState<{
    exists: boolean
    message: string
  } | null>(null)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)

  const supabase = createClient()

  // Update userRole when defaultRole changes (e.g., when opening host registration)
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, userRole: defaultRole }))
    }
  }, [isOpen, defaultRole])

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5
    return Math.min(strength, 100)
  }

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 25) return "Very Weak"
    if (strength < 50) return "Weak"
    if (strength < 75) return "Good"
    return "Strong"
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 25) return "bg-red-500"
    if (strength < 50) return "bg-orange-500"
    if (strength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const validateField = (field: keyof RegistrationData, value: string | boolean): string | null => {
    switch (field) {
      case "firstName":
        if (!value || (typeof value === "string" && value.trim().length < 2)) {
          return "First name must be at least 2 characters"
        }
        break
      case "lastName":
        if (!value || (typeof value === "string" && value.trim().length < 2)) {
          return "Last name must be at least 2 characters"
        }
        break
      case "email":
        if (!value) {
          return "Email is required"
        }
        if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address"
        }
        if (emailCheckResult?.exists) {
          return "This email is already registered. Please sign in instead."
        }
        break
      case "password":
        if (!value) {
          return "Password is required"
        }
        if (typeof value === "string" && value.length < 8) {
          return "Password must be at least 8 characters"
        }
        if (typeof value === "string" && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return "Password must contain uppercase, lowercase, and number"
        }
        break
      case "confirmPassword":
        if (!value) {
          return "Please confirm your password"
        }
        if (value !== formData.password) {
          return "Passwords do not match"
        }
        break
      case "agreeToTerms":
        if (!value) {
          return "You must agree to the terms and conditions"
        }
        break
    }
    return null
  }

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "password" && typeof value === "string") {
      setPasswordStrength(calculatePasswordStrength(value))
    }

    const error = validateField(field, value)
    setErrors((prev) => {
      const filtered = prev.filter((e) => e.field !== field)
      if (error) {
        return [...filtered, { field, message: error }]
      }
      return filtered
    })

    if (field === "password" && formData.confirmPassword) {
      const confirmError = validateField("confirmPassword", formData.confirmPassword)
      setErrors((prev) => {
        const filtered = prev.filter((e) => e.field !== "confirmPassword")
        if (confirmError) {
          return [...filtered, { field: "confirmPassword", message: confirmError }]
        }
        return filtered
      })
    }
  }

  const handleEmailBlur = () => {
    if (formData.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      checkEmailExists(formData.email)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = []

    Object.keys(formData).forEach((key) => {
      const field = key as keyof RegistrationData
      const error = validateField(field, formData[field])
      if (error) {
        newErrors.push({ field, message: error })
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const checkEmailExists = async (emailValue: string) => {
    setEmailCheckResult(null)

    if (!emailValue.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return
    }

    setIsCheckingEmail(true)

    try {
      console.log("[v0] Checking email availability:", emailValue)
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Email check result:", data)
        setEmailCheckResult({
          exists: data.exists,
          message: data.message,
        })

        if (data.exists) {
          setErrors((prev) => {
            const filtered = prev.filter((e) => e.field !== "email")
            return [
              ...filtered,
              { field: "email", message: "This email is already registered. Please sign in instead." },
            ]
          })
        } else {
          setErrors((prev) => prev.filter((e) => e.field !== "email"))
        }
      }
    } catch (error) {
      console.error("[v0] Email check failed:", error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    if (emailCheckResult?.exists) {
      setErrors([{ field: "general", message: "This email is already registered. Please sign in instead." }])
      return
    }

    setIsLoading(true)

    try {
      console.log("[v0] Starting registration process for:", formData.email)
      console.log("[v0] Selected role:", formData.userRole)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            display_name:
              `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim() || formData.email.split("@")[0],
            email: formData.email.trim(),
            user_role: formData.userRole,
          },
        },
      })

      if (signUpError) {
        console.error("Registration error:", signUpError)

        if (
          signUpError.message.includes("email") ||
          signUpError.message.includes("smtp") ||
          signUpError.message.includes("mail")
        ) {
          setErrors([
            {
              field: "general",
              message:
                "Your account was created, but we couldn't send the confirmation email. Please contact support@spaceongo.com to verify your account.",
            },
          ])
          setIsSubmitted(true)
          return
        }

        throw signUpError
      }

      console.log("User created successfully:", data.user?.id)

      if (data.user) {
        // IMPORTANT: Sign out immediately - user must verify email before logging in
        await supabase.auth.signOut()
        console.log("[v0] User signed out - must verify email before login")

        // Send verification email via Resend API (this also updates the profile)
        try {
          console.log("[v0] Sending verification email via Resend...")
          const verifyResponse = await fetch("/api/resend/send-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email.trim(),
              firstName: formData.firstName.trim(),
              userId: data.user.id,
              userRole: formData.userRole,
            }),
          })

          const verifyResult = await verifyResponse.json()

          if (!verifyResponse.ok) {
            console.error("[v0] Resend verification email failed:", verifyResult)
          } else {
            console.log("[v0] Verification email sent successfully via Resend")
          }
        } catch (emailError) {
          console.error("[v0] Error sending verification email:", emailError)
        }
      }
      setIsSubmitted(true)
    } catch (error) {
      console.error("Registration failed:", error)
      if (error instanceof Error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          setErrors([
            { field: "general", message: "An account with this email already exists. Please sign in instead." },
          ])
        } else {
          setErrors([{ field: "general", message: error.message }])
        }
      } else {
        setErrors([{ field: "general", message: "Registration failed. Please try again." }])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    const supabase = createClient()
    if (!supabase) {
      setErrors([{ field: "general", message: "Authentication service unavailable. Please try again later." }])
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      console.log("[v0] Initiating Google OAuth registration with role:", formData.userRole)

      const timeoutId = setTimeout(() => {
        console.error("[v0] Google OAuth timeout")
        setErrors([{ field: "general", message: "Request timed out. Please check your popup blocker and try again." }])
        setIsLoading(false)
      }, 10000)

    // Store redirect URL in localStorage for post-auth redirect
    if (redirectUrl) {
      localStorage.setItem("registration_redirect", redirectUrl)
    }
    
    const signupType = formData.userRole === "host" ? "host_signup" : "signup"
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${signupType}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

      clearTimeout(timeoutId)

      if (error) {
        console.error("Google OAuth error:", error)
        const errorMessage = error.message.includes("popup")
          ? "Please enable popups for this site and try again."
          : error.message.includes("redirect")
            ? "OAuth redirect failed. Please check your internet connection."
            : "Google sign-up failed. Please try again."

        setErrors([{ field: "general", message: errorMessage }])
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("Google sign-up error:", error)
      setErrors([{ field: "general", message: error.message || "Google sign-up failed. Please try again." }])
      setIsLoading(false)
    }
  }

  const handleFacebookSignUp = async () => {
    const supabase = createClient()
    if (!supabase) {
      setErrors([
        {
          field: "general",
          message: "Authentication service unavailable. Please try again later.",
        },
      ])
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      console.log("[v0] Initiating Facebook OAuth registration with role:", formData.userRole)

    // Store redirect URL in localStorage for post-auth redirect
    if (redirectUrl) {
      localStorage.setItem("registration_redirect", redirectUrl)
    }
    
    const signupType = formData.userRole === "host" ? "host_signup" : "signup"
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${signupType}`,
      },
    })

      if (error) {
        console.error("Facebook OAuth error:", error)
        setErrors([{ field: "general", message: "Facebook sign-up failed. Please try again." }])
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Facebook sign-up error:", error)
      setErrors([{ field: "general", message: "Facebook sign-up failed. Please try again." }])
      setIsLoading(false)
    }
  }

  const handleLinkedInSignUp = async () => {
    const supabase = createClient()
    if (!supabase) {
      setErrors([
        {
          field: "general",
          message: "Authentication service unavailable. Please try again later.",
        },
      ])
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      console.log("[v0] Initiating LinkedIn OAuth registration with role:", formData.userRole)

    // Store redirect URL in localStorage for post-auth redirect
    if (redirectUrl) {
      localStorage.setItem("registration_redirect", redirectUrl)
    }
    
    const signupType = formData.userRole === "host" ? "host_signup" : "signup"
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${signupType}`,
      },
    })

      if (error) {
        console.error("LinkedIn OAuth error:", error)
        setErrors([{ field: "general", message: "LinkedIn sign-up failed. Please try again." }])
        setIsLoading(false)
      }
    } catch (error) {
      console.error("LinkedIn sign-up error:", error)
      setErrors([{ field: "general", message: "LinkedIn sign-up failed. Please try again." }])
      setIsLoading(false)
    }
  }

  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === field)?.message
  }

  const hasGeneralError = () => {
    return errors.some((error) => error.field === "general")
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
      userRole: "renter",
    })
    setErrors([])
    setIsSubmitted(false)
    setPasswordStrength(0)
    setEmailCheckResult(null)
    setIsCheckingEmail(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  useEffect(() => {
    if (!formData.email.trim()) {
      setEmailCheckResult(null)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setEmailCheckResult(null)
      return
    }

    const timeoutId = setTimeout(() => {
      checkEmailExists(formData.email)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.email])

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
            <DialogTitle className="text-center text-2xl font-bold">Check your email</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center">
            <p className="text-gray-600">
              We've sent a verification email to <strong>{formData.email}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Next steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the verification link in the email</li>
                <li>• Complete your account setup</li>
                <li>• Start exploring spaces!</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                Close
              </Button>
              <Button
                onClick={() => {
                  handleClose()
                  onSuccess?.()
                }}
                className="flex-1"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-center">
            <Image src="/images/spaceongo-logo.png" alt="SpaceOnGo" width={180} height={48} className="h-10 w-auto" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Create your account</DialogTitle>
          <p className="text-gray-600">Join SpaceOnGo and start discovering amazing spaces</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasGeneralError() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.find((error) => error.field === "general")?.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label className="text-sm font-semibold">I want to</Label>
            <RadioGroup value={formData.userRole} onValueChange={(value) => handleInputChange("userRole", value)}>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="renter" id="renter-popup" />
                <Label htmlFor="renter-popup" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">Renter (Rent spaces)</div>
                    <div className="text-xs text-gray-500">Find and book amazing spaces</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="host" id="host-popup" />
                <Label htmlFor="host-popup" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Home className="h-4 w-4 text-green-600" />
                  <div className="text-sm">
                    <div className="font-medium">Host (List my space)</div>
                    <div className="text-xs text-gray-500">Share your space and earn money</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm">
                <User className="inline h-3 w-3 mr-1" />
                First Name *
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={getFieldError("firstName") ? "border-red-500" : ""}
                disabled={isLoading}
                required
              />
              {getFieldError("firstName") && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("firstName")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm">
                <User className="inline h-3 w-3 mr-1" />
                Last Name *
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={getFieldError("lastName") ? "border-red-500" : ""}
                disabled={isLoading}
                required
              />
              {getFieldError("lastName") && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("lastName")}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={handleEmailBlur}
                className={`pl-10 ${getFieldError("email") ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {!isCheckingEmail && emailCheckResult && !emailCheckResult.exists && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
            {getFieldError("email") && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("email")}
              </p>
            )}
            {!getFieldError("email") &&
              emailCheckResult &&
              !emailCheckResult.exists &&
              formData.email.trim() &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Email is available
                </p>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`pl-10 pr-10 ${getFieldError("password") ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Password strength</span>
                  <span
                    className={`font-medium ${passwordStrength >= 75 ? "text-green-600" : passwordStrength >= 50 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <Progress value={passwordStrength} className="h-2">
                  <div
                    className={`h-full rounded-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </Progress>
              </div>
            )}
            {getFieldError("password") && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("password")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`pl-10 pr-10 ${getFieldError("confirmPassword") ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {getFieldError("confirmPassword") && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("confirmPassword")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                disabled={isLoading}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                I agree to SpaceOnGo's{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {getFieldError("agreeToTerms") && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("agreeToTerms")}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isCheckingEmail}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-3 bg-white text-gray-700 hover:text-gray-700 font-medium"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Google</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-3 bg-white text-gray-700 hover:text-gray-700 font-medium"
                onClick={handleFacebookSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#1877F2"
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Facebook</span>
                  </>
                )}
              </Button>
            </div>

            <Button
              type="button"
              className="w-full h-12 bg-[#0077B5] hover:bg-[#006399] text-white transition-colors duration-200 flex items-center justify-center gap-3 font-medium"
              onClick={handleLinkedInSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="text-sm font-medium">LinkedIn</span>
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-600">
            Already have an account?{" "}
            <button type="button" onClick={handleClose} className="text-blue-600 hover:underline font-medium">
              Sign in
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
