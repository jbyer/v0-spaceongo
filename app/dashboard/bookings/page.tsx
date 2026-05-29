"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, User, DollarSign, CheckCircle2, Star } from "lucide-react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { createClient } from "@/lib/supabase/client"
import { RatingModal } from "@/components/rating-modal"
import { formatDate, formatTime } from "@/lib/format-date"
import { useCurrency } from "@/contexts/currency-context"

interface Booking {
  id: string
  start_date: string
  end_date: string
  guest_count: number
  total_amount: number
  final_amount?: number
  status: string
  special_requests?: string
  created_at: string
  spaces: {
    id: string
    title: string
    address_line1: string
    city: string
    state: string
    images: string[]
    host_id: string
  }
  profiles: {
    first_name: string
    last_name: string
    display_name: string
    profile_image_url?: string
  }
}

export default function BookingsPage() {
  const { formatPrice } = useCurrency()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    fetchBookings()

    const supabase = createClient()
    const channel = supabase
      .channel("guest-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          fetchBookings()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings/guest")
      if (!response.ok) {
        throw new Error("Failed to fetch bookings")
      }
      const data = await response.json()
      setBookings(data || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()

  const upcomingBookings = bookings.filter((booking) => {
    const isPaid = booking.status === "confirmed" || booking.status === "pending"
    const startDate = new Date(booking.start_date)
    return isPaid && startDate > now
  })

  const currentBookings = bookings.filter((booking) => {
    const startDate = new Date(booking.start_date)
    const endDate = new Date(booking.end_date)
    const isOngoing = startDate <= now && endDate >= now
    return isOngoing && booking.status !== "cancelled"
  })

  const pastBookings = bookings.filter((booking) => {
    const endDate = new Date(booking.end_date)
    return endDate < now
  })

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))

    if (hours >= 24) {
      const days = Math.ceil(hours / 24)
      return `${days} day${days > 1 ? "s" : ""}`
    }
    return `${hours} hour${hours > 1 ? "s" : ""}`
  }

  const isHourlyBooking = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return hours < 24
  }

  const handleRateBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowRatingModal(true)
  }

  const handleReviewSuccess = () => {
    fetchBookings()
  }

  const renderBookingCard = (booking: Booking, isPastBooking = false) => (
    <Card key={booking.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Space Image */}
          <div className="lg:w-48 h-48 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={booking.spaces.images?.[0] || "/placeholder.svg?height=200&width=300"}
              alt={booking.spaces.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Booking Details */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">{booking.spaces.title}</h3>
                {booking.status === "cancelled" ? (
                  <Badge className="bg-red-100 text-red-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Cancelled
                  </Badge>
                ) : booking.status === "completed" ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : booking.status === "confirmed" ? (
                  <Badge className="bg-blue-100 text-blue-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Confirmed
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-gray-600 text-sm gap-1 mb-3">
                <MapPin className="h-4 w-4" />
                {booking.spaces.city}, {booking.spaces.state}
              </div>

              {isHourlyBooking(booking.start_date, booking.end_date) ? (
                // Hourly booking - show date, times, and duration
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="font-semibold text-blue-900">{formatDate(booking.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Start Time</p>
                      <p className="font-semibold text-blue-900">{formatTime(booking.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">End Time</p>
                      <p className="font-semibold text-blue-900">{formatTime(booking.end_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="font-semibold text-blue-900">
                        {calculateDuration(booking.start_date, booking.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Daily booking - show check-in/out dates
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Check-in</p>
                      <p className="font-medium">{formatDate(booking.start_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Check-out</p>
                      <p className="font-medium">{formatDate(booking.end_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Guests</p>
                      <p className="font-medium">
                        {booking.guest_count} guest{booking.guest_count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isHourlyBooking(booking.start_date, booking.end_date) && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Guests:</span>
                  <span className="font-medium">
                    {booking.guest_count} guest{booking.guest_count > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {!isHourlyBooking(booking.start_date, booking.end_date) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Duration:</span>
                  <span className="font-medium">{calculateDuration(booking.start_date, booking.end_date)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-3 border-t">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.profiles.profile_image_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {booking.profiles.first_name?.[0]}
                  {booking.profiles.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-gray-600">Rented by</p>
                <p className="font-medium">
                  {booking.profiles.display_name || `${booking.profiles.first_name} ${booking.profiles.last_name}`}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-sm text-gray-600">Total Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(booking.final_amount || booking.total_amount)}
                </p>
              </div>
              {isPastBooking && booking.status !== "cancelled" ? (
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleRateBooking(booking)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate Space
                </Button>
              ) : isPastBooking && booking.status === "cancelled" ? (
                <Badge variant="outline" className="text-red-600 border-red-300">
                  Booking Cancelled
                </Badge>
              ) : (
                <Button variant="outline">View Details</Button>
              )}
            </div>
          </div>
        </div>

        {booking.special_requests && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium mb-1">Your Special Requests:</p>
            <p className="text-sm text-gray-800">{booking.special_requests}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex flex-1">
          <DashboardSidebar activeTab="bookings" />
          <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </main>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex flex-1">
        <DashboardSidebar activeTab="bookings" />
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
              <p className="text-gray-600">View and manage your completed and upcoming space bookings</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Upcoming Bookings</p>
                      <p className="text-2xl font-bold text-purple-600">{upcomingBookings.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Bookings</p>
                      <p className="text-2xl font-bold text-blue-600">{currentBookings.length}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Past Bookings</p>
                      <p className="text-2xl font-bold text-gray-600">{pastBookings.length}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(bookings
                          .filter((b) => b.status === "completed" || b.status === "confirmed" || b.status === "pending")
                          .reduce((sum, b) => sum + (b.final_amount || b.total_amount), 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Current and Past Bookings */}
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="w-full md:w-auto mb-6 bg-white">
                <TabsTrigger value="upcoming" className="flex-1 md:flex-none">
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="current" className="flex-1 md:flex-none">
                  Current ({currentBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="flex-1 md:flex-none">
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              {/* Upcoming Bookings Tab Content */}
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Bookings</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        You don't have any future bookings scheduled. Browse available spaces and make a reservation!
                      </p>
                      <Button size="lg" onClick={() => (window.location.href = "/find-space")}>
                        Explore Spaces
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingBookings.map(renderBookingCard)
                )}
              </TabsContent>

              {/* Current Bookings Tab Content */}
              <TabsContent value="current" className="space-y-4">
                {currentBookings.length === 0 ? (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Current Bookings</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        You don't have any ongoing bookings at the moment. Browse available spaces and make your next
                        booking!
                      </p>
                      <Button size="lg" onClick={() => (window.location.href = "/find-space")}>
                        Explore Spaces
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  currentBookings.map(renderBookingCard)
                )}
              </TabsContent>

              {/* Past Bookings Tab Content */}
              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                      <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Past Bookings</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Your completed bookings will appear here once they've ended
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  pastBookings.map((booking) => renderBookingCard(booking, true))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Rating Modal */}
      {selectedBooking && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false)
            setSelectedBooking(null)
          }}
          bookingId={selectedBooking.id}
          spaceId={selectedBooking.spaces.id}
          spaceTitle={selectedBooking.spaces.title}
          hostId={selectedBooking.spaces.host_id}
          onSuccess={handleReviewSuccess}
        />
      )}

      <SiteFooter />
    </div>
  )
}
