"use client"

import { useRef } from "react"

import { Suspense, useCallback, useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { createBookingCheckoutSession } from "@/app/actions/stripe"
import { useRouter } from "next/navigation"
import { Loader2, Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format, differenceInDays, differenceInHours } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useCurrency } from "@/contexts/currency-context"

const stripePromise = (() => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    console.error("[v0] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set")
    return null
  }
  return loadStripe(key)
})()

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
}

type SpaceData = {
  id: string
  title: string
  space_type: string
  city: string
  state: string
  address_line1: string
  capacity: number | null
  images: string[] | null
  price_per_hour: number | null
  price_per_day: number | null
}

function CheckoutContent() {
  const searchParams = useSearchParams()

  const spaceId = searchParams.get("spaceId")
  const rentalType = searchParams.get("rentalType") as "hourly" | "daily"
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const startTime = searchParams.get("startTime")
  const endTime = searchParams.get("endTime")

  const router = useRouter()
  const { formatPrice } = useCurrency()
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null)
  const [isLoadingSpace, setIsLoadingSpace] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const checkoutSessionIdRef = useRef<string | null>(null)

  // Check if Stripe is properly configured
  useEffect(() => {
    if (!stripePromise || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripeError("Stripe is not properly configured. Please contact support.")
    }
  }, [])

  useEffect(() => {
    const fetchSpaceDetails = async () => {
      if (!spaceId) return

      try {
        setIsLoadingSpace(true)
        const supabase = createClient()
        const { data, error } = await supabase
          .from("spaces")
          .select("id, title, space_type, city, state, address_line1, capacity, images, price_per_hour, price_per_day")
          .eq("id", spaceId)
          .single()

        if (error) {
          console.error("Error fetching space:", error)
          return
        }

        setSpaceData(data)
      } catch (error) {
        console.error("Error in fetchSpaceDetails:", error)
      } finally {
        setIsLoadingSpace(false)
      }
    }

    fetchSpaceDetails()
  }, [spaceId])

  const fetchClientSecret = useCallback(async () => {
    try {
      console.log("[v0] fetchClientSecret called")
      if (!spaceId || !rentalType || !startDate) {
        throw new Error("Missing required booking parameters")
      }

      const result = await createBookingCheckoutSession({
        spaceId,
        rentalType,
        startDate,
        ...(endDate ? { endDate } : {}),
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
      })

      if (!result?.clientSecret) {
        throw new Error("No client secret returned from server")
      }

      console.log("[v0] Client secret retrieved successfully")

      // Store the Stripe session ID for use in onComplete
      if (result?.sessionId) {
        checkoutSessionIdRef.current = result.sessionId
      }

      return result.clientSecret
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment"
      console.error("[v0] Error fetching client secret:", errorMessage)
      setCheckoutError(errorMessage)
      // Don't rethrow - let the error display in the UI instead of causing a render error
      return undefined
    }
  }, [])

  // Use useMemo to create stable options object
  const checkoutOptions = useMemo(
    () => ({
      fetchClientSecret,
      onComplete: async () => {
        console.log("[v0] Payment completed")
        // Redirect to success page after payment completes
        const sid = checkoutSessionIdRef.current
        if (sid) {
          router.push(`/checkout/success?session_id=${sid}`)
        } else {
          // Fallback: redirect to bookings page if session ID is missing
          router.push("/dashboard/bookings")
        }
      },
    }),
    [fetchClientSecret, router],
  )

  if (!spaceId || !rentalType || !startDate) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Booking</h2>
          <p className="text-muted-foreground">Missing required booking information. Please try again.</p>
        </div>
      </div>
    )
  }

  const startDateTime = new Date(startDate)
  const endDateTime = endDate ? new Date(endDate) : startDateTime
  const duration =
    rentalType === "daily"
      ? differenceInDays(endDateTime, startDateTime) || 1
      : differenceInHours(
          new Date(`${startDate.split("T")[0]}T${endTime}`),
          new Date(`${startDate.split("T")[0]}T${startTime}`),
        )

  const displayImages =
    spaceData?.images && spaceData.images.length > 0
      ? spaceData.images
      : ["/placeholder.svg?height=400&width=600&text=Space+Image"]

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))
  }

  const basePrice =
    rentalType === "daily" ? (spaceData?.price_per_day || 0) * duration : (spaceData?.price_per_hour || 0) * duration
  const serviceFee = basePrice * 0.03
  const tax = basePrice * 0.08
  const totalPrice = basePrice + serviceFee + tax

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>

              {isLoadingSpace ? (
                <div className="w-full h-64 bg-muted rounded-lg animate-pulse" />
              ) : (
                <div className="relative mb-4 group">
                  <img
                    src={displayImages[currentImageIndex] || "/placeholder.svg"}
                    alt={`${spaceData?.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {displayImages.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handlePreviousImage}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleNextImage}
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {displayImages.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {isLoadingSpace ? (
                  <>
                    <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold">{spaceData?.title}</h3>
                      <Badge variant="secondary" className="mt-2">
                        {spaceData?.space_type}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        {spaceData?.address_line1}, {spaceData?.city}, {spaceData?.state}
                      </span>
                    </div>

                    {spaceData?.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">Capacity: Up to {spaceData.capacity} people</span>
                      </div>
                    )}
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Booking Details</h4>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rentalType === "daily" ? "Check-in & Check-out" : "Date"}</p>
                      <p className="text-sm text-muted-foreground">
                        {rentalType === "daily" ? (
                          <>
                            {format(startDateTime, "MMM dd, yyyy")} - {format(endDateTime, "MMM dd, yyyy")}
                          </>
                        ) : (
                          format(startDateTime, "MMM dd, yyyy")
                        )}
                      </p>
                    </div>
                  </div>

                  {rentalType === "hourly" && startTime && endTime && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Time</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeTo12Hour(startTime)} - {formatTimeTo12Hour(endTime)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {duration} {rentalType === "daily" ? (duration === 1 ? "day" : "days") : "hours"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Price Details</h4>

                    <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {formatPrice(rentalType === "daily" ? spaceData?.price_per_day : spaceData?.price_per_hour)} ×{" "}
                        {duration} {rentalType === "daily" ? (duration === 1 ? "day" : "days") : "hours"}
                      </span>
                      <span className="font-medium">{formatPrice(basePrice)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee (3%)</span>
                      <span className="font-medium">{formatPrice(serviceFee)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (8%)</span>
                      <span className="font-medium">{formatPrice(tax)}</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-base font-semibold pt-1">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Important Information</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Your payment will be processed securely through Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>You'll receive a booking confirmation via email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Cancellation policy applies as per the space terms</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

              <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Booking Type:</span>
                  <span className="font-medium capitalize">{rentalType}</span>
                </div>

                {rentalType === "hourly" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Hours Booked:</span>
                    <span className="font-medium">
                      {duration} {duration === 1 ? "hour" : "hours"}
                    </span>
                  </div>
                )}

                {rentalType === "daily" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Days Booked:</span>
                    <span className="font-medium">
                      {duration} {duration === 1 ? "day" : "days"}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
              {/* </CHANGE> */}

              <div id="checkout">
                {stripeError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Configuration Error:</strong> {stripeError}
                    </p>
                  </div>
                )}

                {checkoutError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Payment Error:</strong> {checkoutError}
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      Please try again or contact support if the problem persists.
                    </p>
                  </div>
                )}

                {!checkoutError && !stripeError && (
                  <EmbeddedCheckoutProvider stripe={stripePromise} options={checkoutOptions}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12">
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-muted-foreground">Loading checkout...</p>
                </div>
              </div>
            </div>
          }
        >
          <CheckoutContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
