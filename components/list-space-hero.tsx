"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import LoginPopup from "./login-popup"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function ListSpaceHero() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
    agreeToTerms: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isFacebookLoading, setIsFacebookLoading] = useState(false)
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("") // Clear error on input change
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (formData.password !== formData.repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      // Check if email already exists
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim() }),
      })

      const checkData = await checkResponse.json()
      if (checkData.exists) {
        setError("An account with this email already exists")
        setIsLoading(false)
        return
      }

      // Create user with Supabase (NO emailRedirectTo to disable Supabase emails)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.username,
            last_name: "",
            display_name: formData.username,
            email: formData.email.trim(),
            user_role: "host", // List space users are hosts
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // IMPORTANT: Sign out immediately - user must verify email before logging in
        await supabase.auth.signOut()

        // Send verification email via Resend API (this also updates the profile)
        try {
          const verifyResponse = await fetch("/api/resend/send-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email.trim(),
              firstName: formData.username,
              userId: data.user.id,
              userRole: "host",
            }),
          })

          if (!verifyResponse.ok) {
            const verifyResult = await verifyResponse.json()
            console.error("Failed to send verification email:", verifyResult)
          }
        } catch (emailError) {
          console.error("Error sending verification email:", emailError)
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        })

        router.push(`/auth/sign-up-success?email=${encodeURIComponent(formData.email.trim())}&role=host`)
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=host_signup`,
        },
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Google sign-up failed:", error)
      toast({
        title: "Error",
        description: "Google sign-up failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleFacebookSignUp = async () => {
    setIsFacebookLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=host_signup`,
        },
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Facebook sign-up failed:", error)
      toast({
        title: "Error",
        description: "Facebook sign-up failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFacebookLoading(false)
    }
  }

  const handleLinkedInSignUp = async () => {
    setIsLinkedInLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?type=host_signup`,
        },
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("LinkedIn sign-up failed:", error)
      toast({
        title: "Error",
        description: "LinkedIn sign-up failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLinkedInLoading(false)
    }
  }

  return (
    <>
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Hero Content */}
            <div className="space-y-6">
              <div>
                <h1
                  className="font-bold text-gray-800 leading-tight mb-[36px] md:mb-4 text-balance"
                  style={{ fontSize: "clamp(1.5rem, 4vw + 0.5rem, 3rem)" }}
                >
                  Turn Space Into Opportunity!
                </h1>
                <p className="sm:text-xl text-gray-600 leading-relaxed text-balance">
                  Start To Earn Money On Your Schedule
                </p>
              </div>

              <div className="space-y-4 text-gray-600">
                <p className="text-lg">
                  Join thousands of space owners who are already earning extra income by listing their unused spaces on
                  SpaceOnGo.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Set your own schedule and pricing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure payments and insurance coverage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>24/7 customer support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold text-gray-800">Register</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="username" className="sr-only">
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="h-12"
                        disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="sr-only">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="h-12"
                        disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="sr-only">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="h-12"
                        disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="repeatPassword" className="sr-only">
                        Repeat Password
                      </Label>
                      <Input
                        id="repeatPassword"
                        type="password"
                        placeholder="Repeat Password"
                        value={formData.repeatPassword}
                        onChange={(e) => handleInputChange("repeatPassword", e.target.value)}
                        className="h-12"
                        disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                        disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                        I agree with your{" "}
                        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Terms & Conditions
                        </Link>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-medium"
                      disabled={
                        !formData.agreeToTerms || isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading
                      }
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or sign up with</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-3 bg-white text-gray-700 hover:text-gray-700 font-medium"
                          onClick={handleGoogleSignUp}
                          disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                        >
                          {isGoogleLoading ? (
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
                          disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                        >
                          {isFacebookLoading ? (
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
                        disabled={isLoading || isGoogleLoading || isFacebookLoading || isLinkedInLoading}
                      >
                        {isLinkedInLoading ? (
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
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setShowLoginPopup(true)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Login here
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </>
  )
}
