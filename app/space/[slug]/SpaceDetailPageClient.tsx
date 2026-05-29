"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ReviewSystem } from "@/components/review-system"
import { SpaceReviewsSummary } from "@/components/space-reviews-summary"
import { TrustIndicators } from "@/components/trust-indicators"
import GoogleMapsLocation from "@/components/google-maps-location"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { MapPin, Users, Wifi, Car, Coffee, Heart, Share2, ArrowLeft, Loader2, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSpaces } from "@/lib/api/spaces"
import Link from "next/link"
import { BookingCard } from "@/components/booking-card"
import { useCurrency } from "@/contexts/currency-context"
import { trackSpaceView } from "@/app/actions/views"
import { Textarea } from "@/components/ui/textarea"

type SpaceData = {
  id: string
  title: string
  city: string
  state: string
  address: string | null
  space_type: string
  capacity: number | null
  price_per_day: number | null
  price_per_hour: number | null
  rating_average: number | null
  rating_count: number | null
  images: string[] | null
  amenities: string[] | null
  short_description: string | null
  long_description: string | null
  is_featured: boolean
  instant_book: boolean
  host_id: string
  created_at: string
  latitude: number | null
  longitude: number | null
}

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Parking: Car,
  Kitchen: Coffee,
  Coffee: Coffee,
}

type SpaceDetailPageClientProps = {
  spaceData: SpaceData | null
  initialError: string | null
  spaceId: string
}

export default function SpaceDetailPageClient({ spaceData, initialError, spaceId }: SpaceDetailPageClientProps) {
  const router = useRouter()
  const { toggleFavorite } = useSpaces()
  const { formatPrice } = useCurrency()

  const [space, setSpace] = useState<SpaceData | null>(spaceData)
  const [isLoading, setIsLoading] = useState(false) // Initially false since data is fetched server-side
  const [error, setError] = useState<string | null>(initialError)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false)
  const [checkingBooking, setCheckingBooking] = useState(true)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [pendingBookingData, setPendingBookingData] = useState<{
    rentalType: "hourly" | "daily"
    startDate: Date
    endDate?: Date
    startTime?: string
    endTime?: string
  } | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageContent, setMessageContent] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false) // Added email validation state

  useEffect(() => {
    // If space data was not fetched server-side, fetch it now
    const fetchSpace = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const supabase = createClient()

        console.log("Fetching space with ID:", spaceId)

        const { data, error } = await supabase
          .from("spaces")
          .select("*, latitude, longitude")
          .eq("id", spaceId)
          .eq("is_active", true)
          .single()

        if (error) {
          console.error("Error fetching space:", error)
          if (error.code === "PGRST116") {
            setError("Space not found")
          } else {
            throw error
          }
          return
        }

        console.log("Fetched space data:", data)
        setSpace(data)

        trackSpaceView(spaceId).then((result) => {
          if (result.success && !result.duplicate) {
            console.log("Space view tracked")
          }
        })
      } catch (error) {
        console.error("Error in fetchSpace:", error)
        setError("Failed to load space details")
      } finally {
        setIsLoading(false)
      }
    }

    if (!spaceData && spaceId) {
      fetchSpace()
    } else if (spaceData) {
      // If data was fetched server-side, still track the view
      trackSpaceView(spaceId).then((result) => {
        if (result.success && !result.duplicate) {
          console.log("Space view tracked")
        }
      })
    }
  }, [spaceId, spaceData])

  useEffect(() => {
    const checkAuthAndFavorite = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setIsAuthenticated(!!user)

      if (user && spaceId) {
        const { data } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("space_id", spaceId)
          .maybeSingle()

        setIsFavorite(!!data)
      }
    }

    checkAuthAndFavorite()
  }, [spaceId])

  useEffect(() => {
    const checkUserBooking = async () => {
      try {
        setCheckingBooking(true)
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setHasConfirmedBooking(false)
          setCheckingBooking(false)
          return
        }

        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("id, status")
          .eq("space_id", spaceId)
          .eq("guest_id", user.id)
          .in("status", ["confirmed", "completed"])
          .limit(1)

        if (error) {
          console.error("Error checking bookings:", error)
          setHasConfirmedBooking(false)
        } else {
          setHasConfirmedBooking(bookings && bookings.length > 0)
          console.log("User has confirmed booking:", bookings && bookings.length > 0)
        }
      } catch (error) {
        console.error("Error in checkUserBooking:", error)
        setHasConfirmedBooking(false)
      } finally {
        setCheckingBooking(false)
      }
    }

    if (spaceId) {
      checkUserBooking()
    }
  }, [spaceId])

  useEffect(() => {
    const fetchReviewsCount = async () => {
      try {
        setLoadingReviews(true)
        const supabase = createClient()

        const { count, error } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("space_id", spaceId)
          .eq("is_public", true)
          .eq("review_type", "space_review")

        if (error) {
          console.error("Error fetching reviews count:", error)
          setReviewsCount(0)
        } else {
          setReviewsCount(count || 0)
          console.log("Reviews count for space:", count)
        }
      } catch (error) {
        console.error("Error in fetchReviewsCount:", error)
        setReviewsCount(0)
      } finally {
        setLoadingReviews(false)
      }
    }

    if (spaceId) {
      fetchReviewsCount()
    }
  }, [spaceId])

  const handleSaveClick = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    try {
      setIsTogglingFavorite(true)
      const newFavoriteStatus = await toggleFavorite(spaceId)
      setIsFavorite(newFavoriteStatus)
    } catch (error) {
      console.error("Error toggling favorite:", error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  // Added email validation function
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setIsAuthenticating(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setAuthError("Invalid email or password. Please try again.")
        } else if (error.message.includes("Email not confirmed")) {
          setAuthError("Please verify your email address before logging in.")
        } else {
          setAuthError(error.message)
        }
        return
      }

      if (data.user) {
        setIsAuthenticated(true)

        // Check if this was triggered from Book Now
        if (showLoginPrompt && pendingBookingData) {
          setShowLoginPrompt(false)
          await proceedToCheckout(pendingBookingData)
          setPendingBookingData(null)
        } else {
          // This was triggered from Save button
          setShowAuthModal(false)
          const newFavoriteStatus = await toggleFavorite(spaceId)
          setIsFavorite(newFavoriteStatus)
        }
      }
    } catch (error: any) {
      setAuthError(error.message || "An error occurred during login")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters")
      return
    }

    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      setAuthError("An account with this email already exists. Please sign in instead.")
      return
    }

    setIsAuthenticating(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
            email: email.trim(),
          },
        },
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      console.log("[v0] User created successfully:", data.user?.id)
      console.log("[v0] Supabase will send verification email automatically")

      if (data.user) {
        setIsAuthenticated(true)

        // Check if this was triggered from Book Now
        if (showLoginPrompt && pendingBookingData) {
          setShowLoginPrompt(false)
          await proceedToCheckout(pendingBookingData)
          setPendingBookingData(null)
        } else {
          // This was triggered from Save button
          setShowAuthModal(false)
          const newFavoriteStatus = await toggleFavorite(spaceId)
          setIsFavorite(newFavoriteStatus)
        }
      }
    } catch (error: any) {
      setAuthError(error.message || "An error occurred during registration")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleGoogleLogin = async () => {
    setAuthError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          setAuthError("Google login is not configured yet. Please use email/password login.")
        } else {
          setAuthError(error.message)
        }
      }
    } catch (error: any) {
      setAuthError(error.message || "An error occurred with Google login")
    }
  }

  const handleFacebookLogin = async () => {
    setAuthError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          setAuthError("Facebook login is not configured yet. Please use email/password login.")
        } else {
          setAuthError(error.message)
        }
      }
    } catch (error: any) {
      setAuthError(error.message || "An error occurred with Facebook login")
    }
  }

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const title = space?.title || "Check out this space"
    const text = `${title} - ${space?.short_description || "Available for booking on SpaceOnGo"}`

    setShareUrl(url)

    // Check if Web Share API is supported (mobile devices and modern browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        })
        console.log("Successfully shared via Web Share API")
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error)
          // Fallback to modal if Web Share API fails
          setShowShareModal(true)
        }
      }
    } else {
      // Fallback to custom share modal for desktop
      setShowShareModal(true)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(space?.title || "")}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${space?.title || ""} - ${shareUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(space?.title || "")}&body=${encodeURIComponent(`Check out this space: ${shareUrl}`)}`,
  }

  const handleCheckAvailability = (data: {
    rentalType: "hourly" | "daily"
    startDate: Date
    endDate?: Date
    startTime?: string
    endTime?: string
  }) => {
    console.log("Checking availability with data:", data)
    // TODO: Implement availability check and redirect to booking page
  }

  const handleBookNow = async (data: {
    rentalType: "hourly" | "daily"
    startDate: Date
    endDate?: Date
    startTime?: string
    endTime?: string
  }) => {
    console.log("Book Now clicked with data:", data)

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store booking data and show login prompt
      setPendingBookingData(data)
      setShowLoginPrompt(true)
      return
    }

    // User is authenticated, proceed to checkout
    await proceedToCheckout(data)
  }

  const proceedToCheckout = async (data: {
    rentalType: "hourly" | "daily"
    startDate: Date
    endDate?: Date
    startTime?: string
    endTime?: string
  }) => {
    try {
      // Navigate to checkout page with booking data
      const params = new URLSearchParams({
        spaceId,
        rentalType: data.rentalType,
        startDate: data.startDate.toISOString(),
        ...(data.rentalType === "daily" && data.endDate ? { endDate: data.endDate.toISOString() } : {}),
        ...(data.rentalType === "hourly" ? { startTime: data.startTime!, endTime: data.endTime! } : {}),
      })

      router.push(`/checkout?${params.toString()}`)
    } catch (error) {
      console.error("Error proceeding to checkout:", error)
    }
  }

  const handleContactOwner = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }
    setShowMessageModal(true)
    setMessageContent("")
    setMessageError(null)
  }

  const validateMessage = (content: string): { isValid: boolean; error?: string } => {
    if (content.trim().length === 0) {
      return { isValid: false, error: "Please enter a message" }
    }

    // Email pattern - simple but effective for most email formats
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

    // Fixed phone regex by replacing $$ with $$ and $$ to properly match parentheses
    // Phone pattern - detects various phone number formats
    // Matches: 123-456-7890, (123) 456-7890, 123.456.7890, 1234567890, +1 123 456 7890
    // const phonePattern = /(\+?\d{1,3}[-.\s]?)?$$?\d{3}$$?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,}/g

    if (emailPattern.test(content)) {
      return {
        isValid: false,
        error:
          "Please do not include email addresses in your message. Contact information will be shared after booking confirmation.",
      }
    }

    //if (phonePattern.test(content)) {
    //  return {
    //    isValid: false,
    //    error: "Please do not include phone numbers in your message. Contact information will be shared after booking //confirmation."
    //  }
    //}

    return { isValid: true }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setMessageContent(content)

    // Clear error when user starts typing
    if (messageError && content.trim()) {
      setMessageError(null)
    }
  }

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setMessageError("Please enter a message")
      return
    }

    const validation = validateMessage(messageContent)
    if (!validation.isValid) {
      setMessageError(validation.error)
      return
    }

    if (!space?.host_id) {
      setMessageError("Unable to send message. Please try again.")
      return
    }

    setIsSendingMessage(true)
    setMessageError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessageError("You must be logged in to send a message")
        setIsSendingMessage(false)
        return
      }

      // Insert message into database
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: space.host_id,
        subject: `Inquiry about ${space.title}`,
        content: messageContent,
        message_type: "booking_inquiry",
      })

      if (error) {
        console.error("[v0] Error sending message:", error)
        setMessageError("Failed to send message. Please try again.")
        setIsSendingMessage(false)
        return
      }

      // Success - close modal and show success message
      setShowMessageModal(false)
      setMessageContent("")

      // You could add a toast notification here if you have one
      alert("Message sent successfully! The space owner will receive your inquiry.")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setMessageError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading space details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !space) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12">
          <div className="text-center py-24">
            <h2 className="text-2xl font-bold mb-4">Space Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "The space you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild>
              <Link href="/all-spaces">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Spaces
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const displayImages =
    space.images && space.images.length > 0 ? space.images : ["/placeholder.svg?height=400&width=600&text=No+Image"]

  const fullAddress = space.address || `${space.city}, ${space.state}`
  const location = `${space.city}, ${space.state}`
  const priceDisplay = space.price_per_hour || space.price_per_day || 0
  const priceUnit = space.price_per_hour ? "per hour" : "per day"

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/all-spaces">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Spaces
          </Link>
        </Button>

        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{space.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {location}
                </div>
                {space.capacity && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Up to {space.capacity} people
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                size="sm"
                onClick={handleContactOwner}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Contact Owner
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                size="sm"
                onClick={handleSaveClick}
                disabled={isTogglingFavorite}
              >
                {isTogglingFavorite ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 mr-1 ${isFavorite ? "fill-white" : ""}`} />
                )}
                {isFavorite ? "Saved" : "Save"}
              </Button>
              <Button
                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg transition-all"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {displayImages.slice(0, 5).map((image, index) => (
            <div
              key={index}
              className={`${index === 0 ? "md:col-span-2 md:row-span-2" : ""} relative cursor-pointer`}
              onClick={() => setCurrentImageIndex(index)}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`${space.title} - View ${index + 1}`}
                className="w-full h-64 md:h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About this space</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {space.long_description || space.short_description || "No description available."}
                </p>
                {space.short_description &&
                  space.long_description &&
                  space.short_description !== space.long_description && (
                    <p className="text-muted-foreground leading-relaxed">{space.short_description}</p>
                  )}
              </CardContent>
            </Card>

            {space.amenities && space.amenities.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {space.amenities.map((amenity) => {
                      const IconComponent = amenityIcons[amenity]
                      return (
                        <div key={amenity} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          {IconComponent && <IconComponent className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-sm">{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <GoogleMapsLocation
              address={fullAddress}
              spaceName={space.title}
              latitude={space.latitude}
              longitude={space.longitude}
              showExactLocation={hasConfirmedBooking}
            />

            {!loadingReviews && reviewsCount > 0 && (
              <div id="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ReviewSystem
                  spaceId={spaceId}
                  reviews={[]}
                  averageRating={space.rating_average || 0}
                  totalReviews={space.rating_count || 0}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <BookingCard
              spaceId={spaceId}
              pricePerHour={space.price_per_hour}
              pricePerDay={space.price_per_day}
              onCheckAvailability={handleCheckAvailability}
              onBookNow={handleBookNow}
            />

<SpaceReviewsSummary
  spaceId={spaceId}
  spaceTitle={space.title}
  averageRating={space.rating_average || 0}
              totalReviews={space.rating_count || 0}
            />

            <TrustIndicators
              verified={true}
              superhost={space.is_featured}
              instantBooking={space.instant_book}
              responseRate={98}
              responseTime="within an hour"
              totalBookings={space.rating_count || 0}
              memberSince={new Date(space.created_at).getFullYear().toString()}
            />
          </div>
        </div>
      </main>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{authMode === "login" ? "Sign In to Continue" : "Create an Account"}</DialogTitle>
            <DialogDescription>
              {authMode === "login"
                ? "Sign in to save this space to your favorites"
                : "Sign up to save this space to your favorites"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {authError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{authError}</div>
            )}

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {authMode === "register" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isAuthenticating || isCheckingEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isAuthenticating || isCheckingEmail}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isAuthenticating || isCheckingEmail}
                />
                {isCheckingEmail && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking email...
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isAuthenticating || isCheckingEmail}
                />
              </div>

              {authMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isAuthenticating || isCheckingEmail}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isAuthenticating || isCheckingEmail}>
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {authMode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : authMode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isAuthenticating || isCheckingEmail}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleFacebookLogin}
                disabled={isAuthenticating || isCheckingEmail}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            <div className="text-center text-sm">
              {authMode === "login" ? (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register")
                      setAuthError(null)
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login")
                      setAuthError(null)
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to book this space. Please sign in or create an account to continue with your
              booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {authError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{authError}</div>
            )}

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {authMode === "register" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isAuthenticating || isCheckingEmail}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isAuthenticating || isCheckingEmail}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isAuthenticating || isCheckingEmail}
                />
                {isCheckingEmail && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking email...
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isAuthenticating || isCheckingEmail}
                />
              </div>

              {authMode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isAuthenticating || isCheckingEmail}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isAuthenticating || isCheckingEmail}>
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {authMode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : authMode === "login" ? (
                  "Sign In & Continue to Booking"
                ) : (
                  "Create Account & Continue to Booking"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isAuthenticating || isCheckingEmail}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleFacebookLogin}
                disabled={isAuthenticating || isCheckingEmail}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            <div className="text-center text-sm">
              {authMode === "login" ? (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register")
                      setAuthError(null)
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login")
                      setAuthError(null)
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this space</DialogTitle>
            <DialogDescription>Share {space?.title} with your friends and family</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Copy Link Section */}
            <div className="space-y-2">
              <Label>Copy Link</Label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button onClick={handleCopyLink} variant="outline" size="sm">
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Social Share Buttons */}
            <div className="space-y-2">
              <Label>Share via</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open(shareLinks.facebook, "_blank", "width=600,height=400")}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open(shareLinks.twitter, "_blank", "width=600,height=400")}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63a9.935 9.935 0 002.4-4.59z" />
                  </svg>
                  Twitter
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open(shareLinks.linkedin, "_blank", "width=600,height=400")}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v11.452zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.065 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => window.open(shareLinks.whatsapp, "_blank")}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start col-span-2 bg-transparent"
                  onClick={() => (window.location.href = shareLinks.email)}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Email
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Space Owner</DialogTitle>
            <DialogDescription>
              Send a message to the owner of {space?.title}. They'll receive your inquiry and can respond in their
              dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {messageError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{messageError}</span>
              </div>
            )}

            <div className="p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-medium">Important:</p>
                <p className="text-xs mt-1">
                  Please do not share phone numbers or email addresses in your message. Contact information will be
                  exchanged after booking confirmation for security purposes.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="Hi! I'm interested in booking your space. Is it available on...?"
                value={messageContent}
                onChange={handleMessageChange}
                className="min-h-[150px] resize-none"
                disabled={isSendingMessage}
              />
              <p className="text-xs text-muted-foreground">
                Include details about your booking needs, dates, and any questions you have about the space.
              </p>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageContent("")
                  setMessageError(null)
                }}
                disabled={isSendingMessage}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isSendingMessage || !messageContent.trim()}>
                {isSendingMessage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
