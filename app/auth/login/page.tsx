"use client"

import type React from "react"
import { Linkedin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ResendVerificationButton } from "@/components/auth/resend-verification-button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "auth_failed") {
      setError("Authentication failed. Please try logging in again.")
    } else if (errorParam === "callback_failed") {
      setError("Authentication callback failed. Please try again.")
    } else if (errorParam === "unverified") {
      setError("Please verify your email address before logging in.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setNeedsVerification(false)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      // Check if email is verified - users cannot login until verified
      if (!data.user?.email_confirmed_at) {
        setError("Please verify your email address before logging in. Check your inbox for the verification link.")
        setNeedsVerification(true)
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_superuser, is_host, email_confirmed_at")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        // Default to dashboard if profile fetch fails
        router.push("/dashboard")
        router.refresh()
        return
      }

      // Determine redirect based on user role
      if (profile?.is_superuser) {
        router.push("/admin")
      } else if (profile?.is_host) {
        // Host users go to host dashboard with listing capabilities
        router.push("/dashboard")
      } else {
        // Renter users go to renter dashboard
        router.push("/dashboard")
      }
      router.refresh()
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Email not confirmed")) {
        setError("Please verify your email address before logging in.")
        setNeedsVerification(true)
      } else {
        setError(error instanceof Error ? error.message : "An error occurred during login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://www.spaceongo.com/auth/callback",
        },
      })

      if (error) throw error
    } catch (error) {
      setError("Google login failed. Please try again or use email/password.")
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: "https://www.spaceongo.com/auth/callback",
        },
      })

      if (error) throw error
    } catch (error) {
      setError("Facebook login failed. Please try again or use email/password.")
      setIsLoading(false)
    }
  }

  const handleLinkedInLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: "https://www.spaceongo.com/auth/callback",
        },
      })

      if (error) throw error
    } catch (error) {
      setError("LinkedIn login failed. Please try again or use email/password.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your email and password to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (needsVerification) setNeedsVerification(false)
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="flex flex-col gap-2">
                        <span>{error}</span>
                        {needsVerification && (
                          <ResendVerificationButton
                            email={email}
                            variant="link"
                            className="p-0 h-auto text-destructive underline hover:text-destructive/80 justify-start"
                            text="Resend verification email"
                          />
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 transition-colors"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
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
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white border-[#1877F2] hover:border-[#166FE5] transition-colors"
                      onClick={handleFacebookLogin}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Sign in with Facebook
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-[#0077B5] hover:bg-[#006699] text-white border-[#0077B5] hover:border-[#006699] transition-colors"
                      onClick={handleLinkedInLogin}
                      disabled={isLoading}
                    >
                      <Linkedin className="mr-2 h-5 w-5" />
                      Sign in with LinkedIn
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4">
                    Sign up
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
