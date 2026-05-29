"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Loader2, Linkedin, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import RegistrationPopup from "./registration-popup"
import { createClient } from "@/lib/supabase/client"

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginError {
  field?: string
  message: string
}

export function LoginForm() {
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
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false)
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
      console.log("[v0] Attempting Supabase login with:", formData.email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        console.error("[v0] Supabase authentication failed:", error)
        setErrors([{ message: error.message || "Login failed. Please try again." }])
        return
      }

      if (data.user) {
        console.log("[v0] Supabase authentication successful:", data.user)

        try {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

          if (profile?.is_superuser) {
            setSuccessMessage(
              `Login successful! Welcome ${profile.display_name || profile.first_name}. Redirecting to admin dashboard...`,
            )
            setTimeout(() => {
              router.push("/admin")
            }, 1500)
          } else {
            setSuccessMessage(
              `Login successful! Welcome ${profile?.display_name || profile?.first_name || "back"}. Redirecting...`,
            )
            setTimeout(() => {
              router.push("/dashboard")
            }, 1500)
          }
        } catch (profileError) {
          console.error("[v0] Profile fetch error:", profileError)
          setSuccessMessage("Login successful! Redirecting...")
          setTimeout(() => {
            router.push("/dashboard")
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
      console.log("[v0] Attempting", provider, "OAuth login")

      const timeoutId = setTimeout(() => {
        console.error("[v0] OAuth redirect timeout - this shouldn't happen")
        setErrors([{ message: "OAuth redirect timed out. Please check your popup blocker." }])
        setIsLoading(false)
      }, 10000) // 10 second timeout

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      })

      clearTimeout(timeoutId)

      if (error) {
        console.error("[v0]", provider, "OAuth failed:", error)
        setErrors([{ message: error.message || `${provider} login failed. Please try again.` }])
        setIsLoading(false)
      }

      // Note: If successful, user will be redirected away from this page
      // so isLoading will remain true (this is expected behavior)
    } catch (error: any) {
      console.error("[v0]", provider, "OAuth error:", error)
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

  const fillDemoCredentials = () => {
    setFormData({
      email: "demo@spaceongo.com",
      password: "password123",
      rememberMe: false,
    })
  }

  const fillRenterDemoCredentials = () => {
    setFormData({
      email: "renter.demo@spaceongo.com",
      password: "DemoRenter2025!",
      rememberMe: false,
    })
  }

  const fillHostDemoCredentials = () => {
    setFormData({
      email: "demo@spaceongo.com",
      password: "password123",
      rememberMe: false,
    })
  }

  const fillSuperuserCredentials = () => {
    setFormData({
      email: "jason@example.com",
      password: "testing123",
      rememberMe: false,
    })
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image src="/images/spaceongo-logo.png" alt="SpaceOnGo" width={150} height={40} className="h-8 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
            <p className="text-gray-600">Sign in to your SpaceOnGo account</p>
          </CardHeader>

          <CardContent className="space-y-6">
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
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                    <span className="hidden sm:inline">Google</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12 bg-transparent hover:bg-blue-50 border-blue-200"
                onClick={() => handleSocialLogin("facebook")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="hidden sm:inline">Facebook</span>
                  </>
                )}
              </Button>
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-[#0077B5] hover:bg-[#006699] text-white border-[#0077B5] hover:border-[#006699] transition-colors"
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
            </div>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${getFieldError("email") ? "border-red-500 focus:border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {getFieldError("email") && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("email")}
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 ${getFieldError("password") ? "border-red-500 focus:border-red-500" : ""}`}
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
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">or</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Test Accounts (For Testing Only)</h4>
              <div className="text-xs text-blue-800 space-y-2">
                <div className="p-3 bg-white rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div className="font-semibold text-green-800">Renter Account</div>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    <div>
                      <span className="font-medium">Email:</span> renter.demo@spaceongo.com
                    </div>
                    <div>
                      <span className="font-medium">Password:</span> DemoRenter2025!
                    </div>
                    <div className="text-xs text-green-700 mt-2 bg-green-50 p-2 rounded border border-green-200">
                      ✓ Role: Renter only (cannot list spaces)
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      ℹ️ Run scripts/010_create_demo_accounts.sql, then create auth user in Supabase
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs w-full border-green-300 hover:bg-green-50 bg-transparent"
                    onClick={fillRenterDemoCredentials}
                    disabled={isLoading}
                  >
                    Fill Renter Credentials
                  </Button>
                </div>

                {/* Host Demo Account */}
                <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-600" />
                        <h3 className="font-semibold text-orange-900">Host Demo</h3>
                      </div>
                      <p className="mt-1 text-xs text-orange-700">Test listing spaces (uses demo account)</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={fillHostDemoCredentials}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 bg-transparent"
                    >
                      Quick Fill
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs text-orange-800">
                    <p className="font-mono">demo@spaceongo.com</p>
                    <p className="font-mono">password123</p>
                  </div>
                </div>

                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div className="font-semibold text-red-800">Superuser Admin</div>
                  </div>
                  <div className="space-y-1 text-gray-700">
                    <div>
                      <span className="font-medium">Email:</span> jason@example.com
                    </div>
                    <div>
                      <span className="font-medium">Password:</span> testing123
                    </div>
                    <div className="text-xs text-red-700 mt-2 bg-red-100 p-2 rounded border border-red-300">
                      ⚠️ Full admin access to all system features
                    </div>
                    <div className="text-xs text-blue-600 mt-2">ℹ️ Existing account - already set up in database</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs w-full border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
                    onClick={fillSuperuserCredentials}
                    disabled={isLoading}
                  >
                    Fill Admin Credentials
                  </Button>
                </div>

                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
                  <strong>⚠️ Testing Only:</strong> These accounts are for development and testing purposes only. Do not
                  use in production environments.
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => setShowRegistrationPopup(true)}
                  className="text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  Sign up for free
                </button>
              </p>
            </div>

            <div className="text-center text-xs text-gray-500 space-x-4">
              <Link href="/terms" className="hover:text-gray-700 hover:underline">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-gray-700 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <RegistrationPopup
        isOpen={showRegistrationPopup}
        onClose={() => setShowRegistrationPopup(false)}
        onSuccess={() => {
          setSuccessMessage("Registration successful! Please check your email to verify your account.")
        }}
      />
    </>
  )
}

export default LoginForm
