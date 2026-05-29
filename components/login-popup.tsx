"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader2, Linkedin } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import RegistrationPopup from "@/components/registration-popup"
import ForgotPasswordPopup from "@/components/forgot-password-popup"

interface LoginPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginError {
  field?: string
  message: string
}

export default function LoginPopup({ isOpen, onClose, onSuccess }: LoginPopupProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<LoginError[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [showRegistration, setShowRegistration] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const supabase = createClient()

  const validateForm = (): boolean => {
    const newErrors: LoginError[] = []

    if (!formData.email) {
      newErrors.push({ field: "email", message: "Email is required" })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ field: "email", message: "Please enter a valid email address" })
    }

    if (!formData.password) {
      newErrors.push({ field: "password", message: "Password is required" })
    } else if (formData.password.length < 6) {
      newErrors.push({ field: "password", message: "Password must be at least 6 characters" })
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (typeof value === "string" && value) {
      setErrors((prev) => prev.filter((error) => error.field !== field))
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setSuccessMessage("")

    if (!validateForm()) return

    setIsLoading(true)

    try {


      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setErrors([{ message: error.message || "Login failed. Please try again." }])
        return
      }

      if (data.user) {

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_superuser, is_host, display_name, first_name")
            .eq("id", data.user.id)
            .single()

          const userName = profile?.display_name || profile?.first_name || "back"

          if (profile?.is_superuser) {
            setSuccessMessage(`Login successful! Welcome ${userName}. Redirecting to admin dashboard...`)
            setTimeout(() => {
              onClose()
              router.push("/admin")
              onSuccess?.()
            }, 1500)
          } else if (profile?.is_host) {
            setSuccessMessage(`Login successful! Welcome ${userName}. Redirecting to host dashboard...`)
            setTimeout(() => {
              onClose()
              router.push("/dashboard")
              onSuccess?.()
            }, 1500)
          } else {
            setSuccessMessage(`Login successful! Welcome ${userName}. Redirecting...`)
            setTimeout(() => {
              onClose()
              router.push("/dashboard")
              onSuccess?.()
            }, 1500)
          }
        } catch (profileError) {
          console.error("Profile fetch error:", profileError)
          setSuccessMessage("Login successful! Redirecting...")
          setTimeout(() => {
            onClose()
            router.push("/dashboard")
            onSuccess?.()
          }, 1500)
        }
      }
    } catch (error: any) {
      console.error("[v0] Supabase authentication failed:", error.message)
      setErrors([{ message: error.message || "An unexpected error occurred. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook" | "linkedin_oidc") => {
    setIsLoading(true)
    setErrors([])

    try {
      const timeoutId = setTimeout(() => {
        setErrors([{ message: "OAuth redirect timed out. Please check your popup blocker." }])
        setIsLoading(false)
      }, 10000)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      })

      clearTimeout(timeoutId)

      if (error) {
        setErrors([{ message: error.message || `${provider} login failed. Please try again.` }])
        setIsLoading(false)
      }
    } catch (error: any) {
      setErrors([{ message: error.message || "An unexpected error occurred. Please try again." }])
      setIsLoading(false)
    }
  }

  const getFieldError = (field: string) => {
    return errors.find((error) => error.field === field)?.message
  }

  const hasGeneralError = () => {
    return errors.some((error) => !error.field)
  }

  const handleClose = () => {
    setFormData({ email: "", password: "", rememberMe: false })
    setErrors([])
    setSuccessMessage("")
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen && !showRegistration && !showForgotPassword} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-center">
              <Image src="/images/spaceongo-logo.png" alt="SpaceOnGo" width={180} height={48} className="h-10 w-auto" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">Welcome back</DialogTitle>
            <p className="text-gray-600">Sign in to your SpaceOnGo account</p>
          </DialogHeader>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {successMessage && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            {hasGeneralError() && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.find((error) => !error.field)?.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                <Mail className="inline h-3 w-3 mr-1" />
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={getFieldError("email") ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {getFieldError("email") && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("email")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                <Lock className="inline h-3 w-3 mr-1" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`pr-10 ${getFieldError("password") ? "border-red-500" : ""}`}
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
              {getFieldError("password") && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("password")}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">Or sign in with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 bg-transparent"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 bg-transparent"
                onClick={() => handleSocialLogin("facebook")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </>
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-[#0077B5] hover:bg-[#006699] text-white border-[#0077B5] hover:border-[#006699]"
              onClick={() => handleSocialLogin("linkedin_oidc")}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Linkedin className="mr-2 h-5 w-5" />
                  LinkedIn
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowRegistration(true)
                }}
                className="text-green-600 font-semibold hover:text-green-700 hover:underline"
              >
                Sign up
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ForgotPasswordPopup
        isOpen={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false)
          handleClose()
        }}
        onBackToLogin={() => {
          setShowForgotPassword(false)
        }}
      />

      <RegistrationPopup
        isOpen={showRegistration}
        onClose={() => {
          setShowRegistration(false)
          handleClose()
        }}
        onSuccess={() => {
          setShowRegistration(false)
          onSuccess?.()
        }}
      />
    </>
  )
}
