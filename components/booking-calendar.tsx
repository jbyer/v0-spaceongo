"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, User, MapPin, DollarSign } from "lucide-react"
import { fetchHostBookings } from "@/app/actions/bookings"
import { useCurrency } from "@/contexts/currency-context"
import { format, parseISO, startOfDay } from "date-fns"

type Booking = {
  id: string
  start_date: string
  end_date: string
  status: string
  total_amount: number
  guest_count: number
  spaces: {
    id: string
    title: string
    address_line1: string
    city: string
    state: string
    images: string[]
  }
  profiles: {
    first_name: string
    last_name: string
    display_name: string
    profile_image_url: string
  }
}

export default function BookingCalendar() {
  const { formatPrice } = useCurrency()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[]>([])

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true)
        const data = await fetchHostBookings()
        setBookings(data as Booking[])
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getBookingsForDate = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return bookings.filter((booking) => {
      const startDate = startOfDay(parseISO(booking.start_date))
      const endDate = startOfDay(parseISO(booking.end_date))
      return targetDate >= startDate && targetDate <= endDate
    })
  }

  const handleDayClick = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayBookings = getBookingsForDate(day)
    if (dayBookings.length > 0) {
      setSelectedDate(targetDate)
      setSelectedDayBookings(dayBookings)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "completed":
        return "bg-blue-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const upcomingBookings = bookings
    .filter((b) => new Date(b.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Booking Calendar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Cancelled</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="p-2 h-20"></div>
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dayBookings = getBookingsForDate(day)
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === currentDate.getMonth() &&
                  new Date().getFullYear() === currentDate.getFullYear()

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`p-2 h-20 border rounded-lg transition-colors ${
                      isToday ? "bg-blue-50 border-blue-200" : "border-gray-200"
                    } ${dayBookings.length > 0 ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  >
                    <div className="text-sm font-medium">{day}</div>
                    {dayBookings.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {dayBookings.slice(0, 2).map((booking, idx) => (
                          <div key={idx} className={`w-full h-1.5 rounded ${getStatusColor(booking.status)}`}></div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayBookings.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading bookings...</div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No upcoming bookings</div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">
                        {booking.profiles.display_name ||
                          `${booking.profiles.first_name} ${booking.profiles.last_name}`}
                      </div>
                      <Badge variant="secondary" className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">{booking.spaces.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(parseISO(booking.start_date), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedDate !== null} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Bookings for {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedDayBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Space Image */}
                    {booking.spaces.images && booking.spaces.images.length > 0 && (
                      <img
                        src={booking.spaces.images[0] || "/placeholder.svg"}
                        alt={booking.spaces.title}
                        className="w-full md:w-32 h-32 object-cover rounded-lg"
                      />
                    )}

                    {/* Booking Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{booking.spaces.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4" />
                            {booking.spaces.city}, {booking.spaces.state}
                          </div>
                        </div>
                        <Badge variant="secondary" className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">Start</div>
                            <div className="text-gray-600">{format(parseISO(booking.start_date), "h:mm a")}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">End</div>
                            <div className="text-gray-600">{format(parseISO(booking.end_date), "h:mm a")}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">Guest</div>
                            <div className="text-gray-600">
                              {booking.profiles.display_name ||
                                `${booking.profiles.first_name} ${booking.profiles.last_name}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">Amount</div>
                            <div className="text-gray-600">{formatPrice(booking.total_amount)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
