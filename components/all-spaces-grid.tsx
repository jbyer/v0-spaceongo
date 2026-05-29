"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useSpaces } from "@/lib/api/spaces"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, Star, MapPin, Users, Wifi, Car, Coffee, Volume2 } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context"
import { getSpaceUrl } from "@/lib/utils/slug"

interface Space {
  id: string
  name: string
  location: string
  type: string
  capacity: number
  dailyRate: number
  hourlyRate: number | null
  rating: number
  reviewCount: number
  image: string
  description: string
  amenities: string[]
  featured: boolean
  verified: boolean
  superhost: boolean
  instantBooking: boolean
}

interface AllSpacesGridProps {
  spaces: Space[]
  viewMode: "grid" | "list"
}

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Parking: Car,
  Coffee: Coffee,
  "Sound System": Volume2,
}

export function AllSpacesGrid({ spaces, viewMode }: AllSpacesGridProps) {
  const { formatPrice } = useCurrency()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const spacesApi = useSpaces()

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (user) {
        try {
          const userFavorites = await spacesApi.getUserFavorites()
          const favoriteIds = new Set(userFavorites.map((space: any) => space.id))
          setFavorites(favoriteIds)
        } catch (error) {
          console.error("[v0] Error loading favorites:", error)
        }
      }
    }
    checkAuth()
  }, [])

  const toggleFavorite = async (spaceId: string) => {
    if (!isAuthenticated) {
      setAuthMode("login")
      setShowAuthModal(true)
      return
    }

    const newFavorites = new Set(favorites)
    const wasFavorited = newFavorites.has(spaceId)

    if (wasFavorited) {
      newFavorites.delete(spaceId)
    } else {
      newFavorites.add(spaceId)
    }
    setFavorites(newFavorites)

    try {
      const isFavorited = await spacesApi.toggleFavorite(spaceId)
      console.log("[v0] Favorite toggled:", { spaceId, isFavorited })
    } catch (error) {
      console.error("[v0] Error toggling favorite:", error)
      if (wasFavorited) {
        newFavorites.add(spaceId)
      } else {
        newFavorites.delete(spaceId)
      }
      setFavorites(new Set(newFavorites))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (!data.user?.email_confirmed_at) {
        setLoginError("Please verify your email address before logging in.")
        await supabase.auth.signOut()
        setIsLoggingIn(false)
        return
      }

      // Login successful
      setIsAuthenticated(true)
      setShowAuthModal(false)
      setEmail("")
      setPassword("")
      router.refresh()
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "Login failed. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const checkEmailExists = async (emailValue: string): Promise<boolean> => {
    if (!emailValue.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return false
    }

    setIsCheckingEmail(true)

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.exists) {
        return true
      }
      return false
    } catch (error) {
      console.error("[v0] Email check failed:", error)
      return false
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setLoginError("Passwords do not match")
      setIsLoggingIn(false)
      return
    }

    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      setLoginError("An account with this email already exists. Please sign in instead.")
      setIsLoggingIn(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName.trim()} ${lastName.trim()}`.trim() || email.split("@")[0],
            email: email.trim(),
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      console.log("[v0] User created successfully:", data.user?.id)

      if (data.user) {
        // IMPORTANT: Sign out immediately - user must verify email before logging in
        await supabase.auth.signOut()
        console.log("[v0] User signed out - must verify email before login")

        try {
          console.log("[v0] Sending verification email via Resend...")
          const verifyResponse = await fetch("/api/resend/send-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              firstName: firstName.trim(),
              userId: data.user.id,
              userRole: "renter",
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

      // Show success message
      setLoginError(null)
      setShowAuthModal(false)
      setEmail("")
      setPassword("")
      setFirstName("")
      setLastName("")
      setConfirmPassword("")

      alert("Registration successful! Please check your email to verify your account.")
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "Registration failed. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const switchAuthMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login")
    setLoginError(null)
    setEmail("")
    setPassword("")
    setFirstName("")
    setLastName("")
    setConfirmPassword("")
  }

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("provider is not enabled") || error.message.includes("Unsupported provider")) {
          throw new Error("Google login is not configured yet. Please contact support or use email/password login.")
        }
        throw error
      }
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "Google login failed. Please try again.")
      setIsLoggingIn(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("provider is not enabled") || error.message.includes("Unsupported provider")) {
          throw new Error("Facebook login is not configured yet. Please contact support or use email/password login.")
        }
        throw error
      }
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "Facebook login failed. Please try again.")
      setIsLoggingIn(false)
    }
  }

  if (spaces.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-1">No spaces found</h3>
          <p>Try adjusting your filters to see more results</p>
        </div>
      </div>
    )
  }

  if (viewMode === "list") {
    return (
      <>
        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{authMode === "login" ? "Sign In to Continue" : "Create Your Account"}</DialogTitle>
              <DialogDescription>
                {authMode === "login"
                  ? "Log in to add spaces to your favorites and access more features."
                  : "Sign up to start booking spaces and managing your favorites."}
              </DialogDescription>
            </DialogHeader>

            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingIn}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingIn}
                  />
                </div>

                {loginError && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{loginError}</div>
                )}

                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoggingIn}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoggingIn}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email-register" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email-register"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingIn}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password-register" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password-register"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingIn}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingIn}
                  />
                </div>

                {loginError && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{loginError}</div>
                )}

                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-transparent"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleFacebookLogin}
                disabled={isLoggingIn}
                className="w-full bg-transparent"
              >
                <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={switchAuthMode}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchAuthMode}
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {spaces.map((space) => (
            <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="relative md:w-80 h-48 md:h-auto">
                  <Image src={space.image || "/placeholder.svg"} alt={space.name} fill className="object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {space.featured && (
                      <div
                        className="badge-featured px-2 py-1 rounded-md text-xs font-medium text-white"
                        style={{ backgroundColor: "#ca8a04" }}
                      >
                        Featured
                      </div>
                    )}
                    {space.verified && <Badge variant="secondary">Verified</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                    onClick={() => toggleFavorite(space.id)}
                  >
                    <Heart
                      className={`h-4 w-4 ${favorites.has(space.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                    />
                  </Button>
                </div>

                <CardContent className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{space.name}</h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {space.location}
                      </div>
                    </div>
                    <div className="text-right">
                      {space.hourlyRate && (
                        <div className="mb-2">
                          <div className="text-lg font-bold text-primary">{formatPrice(space.hourlyRate)}</div>
                          <div className="text-xs text-muted-foreground">per hour</div>
                        </div>
                      )}
                      <div className="text-2xl font-bold text-primary">{formatPrice(space.dailyRate)}</div>
                      <div className="text-sm text-muted-foreground">per day</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-2">{space.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {space.rating} ({space.reviewCount})
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Up to {space.capacity}
                      </div>
                      <Badge variant="outline">{space.type}</Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={getSpaceUrl(space.name, space.id)}>View Details</Link>
                      </Button>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href={`${getSpaceUrl(space.name, space.id)}?book=true`}>Book Now</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{authMode === "login" ? "Sign In to Continue" : "Create Your Account"}</DialogTitle>
            <DialogDescription>
              {authMode === "login"
                ? "Log in to add spaces to your favorites and access more features."
                : "Sign up to start booking spaces and managing your favorites."}
            </DialogDescription>
          </DialogHeader>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoggingIn}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoggingIn}
                />
              </div>

              {loginError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{loginError}</div>
              )}

              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingIn}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email-register" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email-register"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoggingIn}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password-register" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password-register"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoggingIn}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoggingIn}
                />
              </div>

              {loginError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{loginError}</div>
              )}

              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full bg-transparent"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleFacebookLogin}
              disabled={isLoggingIn}
              className="w-full bg-transparent"
            >
              <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {authMode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={switchAuthMode}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchAuthMode}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="relative h-48">
              <Image
                src={space.image || "/placeholder.svg"}
                alt={space.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                {space.featured && (
                  <div
                    className="badge-featured px-2 py-1 rounded-md text-xs font-medium text-white"
                    style={{ backgroundColor: "#ca8a04" }}
                  >
                    Featured
                  </div>
                )}
                {space.verified && <Badge variant="secondary">Verified</Badge>}
                {space.superhost && (
                  <div
                    className="badge-superhost px-2 py-1 rounded-md text-xs font-medium text-white"
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    Superhost
                  </div>
                )}
                {space.instantBooking && (
                  <div
                    className="badge-instant-book px-2 py-1 rounded-md text-xs font-medium text-white"
                    style={{ backgroundColor: "#059669" }}
                  >
                    Instant Book
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                onClick={() => toggleFavorite(space.id)}
              >
                <Heart
                  className={`h-4 w-4 ${favorites.has(space.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                />
              </Button>
            </div>

            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg line-clamp-1">{space.name}</h3>
                <div className="text-right">
                  {space.hourlyRate && (
                    <div className="mb-1">
                      <div className="text-sm font-semibold text-primary">{formatPrice(space.hourlyRate)}/hr</div>
                    </div>
                  )}
                  <div className="text-xl font-bold text-primary">{formatPrice(space.dailyRate)}</div>
                  <div className="text-xs text-muted-foreground">per day</div>
                </div>
              </div>

              <div className="flex items-center text-muted-foreground text-sm mb-2">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{space.location}</span>
              </div>

              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{space.description}</p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    {space.rating}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {space.capacity}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {space.type}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {space.amenities.slice(0, 4).map((amenity) => {
                  const IconComponent = amenityIcons[amenity]
                  return (
                    <div key={amenity} className="flex items-center text-xs text-muted-foreground">
                      {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                      <span className="hidden sm:inline">{amenity}</span>
                    </div>
                  )
                })}
                {space.amenities.length > 4 && (
                  <span className="text-xs text-muted-foreground">+{space.amenities.length - 4} more</span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                  <Link href={getSpaceUrl(space.name, space.id)}>View Details</Link>
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href={`${getSpaceUrl(space.name, space.id)}?book=true`}>Book Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
