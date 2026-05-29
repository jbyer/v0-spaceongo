"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, User, Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { formatDate, formatTime } from "@/lib/format-date"
import { useCurrency } from "@/contexts/currency-context"

interface Booking {
  id: string
  start_date: string
  end_date: string
  guest_count: number
  total_amount: number
  final_amount: number
  status: string
  created_at: string
  total_hours: number
  price_per_hour: number
  spaces: {
    id: string
    title: string
    city: string
    state: string
    profiles: {
      first_name: string
      last_name: string
      display_name: string
      profile_image_url?: string
    }
  }
}

export default function UpcomingBookings() {
  const { formatPrice } = useCurrency()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingBookings()

    // Set up real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel("upcoming-bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          fetchUpcomingBookings()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchUpcomingBookings = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const today = new Date().toISOString()

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          end_date,
          guest_count,
          total_amount,
          final_amount,
          status,
          created_at,
          total_hours,
          price_per_hour,
          spaces (
            id,
            title,
            city,
            state,
            profiles:host_id (
              first_name,
              last_name,
              display_name,
              profile_image_url
            )
          )
        `)
        .eq("guest_id", user.id)
        .in("status", ["confirmed", "pending"])
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(5)

      if (error) {
        console.error("Error fetching upcoming bookings:", error)
      } else {
        setBookings(data || [])
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isHourlyBooking = (totalHours: number) => {
    return totalHours < 24
  }

  const calculateDuration = (startDate: string, endDate: string, totalHours: number) => {
    if (totalHours >= 24) {
      const days = Math.ceil(totalHours / 24)
      return `${days} day${days > 1 ? "s" : ""}`
    }
    return `${totalHours} hour${totalHours > 1 ? "s" : ""}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Bookings
          </div>
          <span className="text-sm font-normal text-gray-500">Future Bookings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No upcoming bookings</p>
            <p className="text-sm text-gray-500">Future bookings will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={booking.spaces.profiles.profile_image_url || "/placeholder.svg"}
                      alt={`${booking.spaces.profiles.first_name} ${booking.spaces.profiles.last_name}`}
                    />
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {booking.spaces.profiles.first_name?.[0] || "O"}
                      {booking.spaces.profiles.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{booking.spaces.title}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          Hosted by{" "}
                          {booking.spaces.profiles.display_name ||
                            `${booking.spaces.profiles.first_name} ${booking.spaces.profiles.last_name}`}
                        </p>
                      </div>
                      <Badge
                        className={`flex-shrink-0 ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }`}
                      >
                        {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(booking.start_date)}
                      </div>
                      {isHourlyBooking(booking.total_hours) ? (
                        <>
                          <div className="flex items-center gap-1 text-blue-600 font-medium">
                            <Clock className="h-3 w-3" />
                            {booking.total_hours} hour{booking.total_hours > 1 ? "s" : ""}
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            {formatTime(booking.start_date)} - {formatTime(booking.end_date)}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {calculateDuration(booking.start_date, booking.end_date, booking.total_hours)}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {booking.spaces.city}, {booking.spaces.state}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {booking.guest_count} guest{booking.guest_count > 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-sm font-semibold text-green-600">
                        {formatPrice(booking.final_amount || booking.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/dashboard/bookings" className="block mt-4">
              <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                View All Bookings
              </button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
