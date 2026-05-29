"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, MapPin, Heart, Search, Clock, TrendingUp, Bell } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"
import UpcomingBookings from "@/components/upcoming-bookings"
import { useCurrency } from "@/contexts/currency-context"

type Booking = Database["public"]["Tables"]["bookings"]["Row"]

export default function RenterDashboardOverview() {
  const [userName, setUserName] = useState("Guest")
  const [totalBookings, setTotalBookings] = useState(0)
  const [upcomingPayments, setUpcomingPayments] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const { formatPrice } = useCurrency()
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    fetchRenterStats()

    const supabase = createClient()
    const channel = supabase
      .channel("renter-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          fetchRenterStats()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRenterStats = async () => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoadingStats(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single()

      if (profile?.first_name) {
        setUserName(profile.first_name)
      }

      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("guest_id", user.id)

      setTotalBookings(bookingsCount || 0)

      const today = new Date().toISOString()
      const { count: upcomingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("guest_id", user.id)
        .eq("status", "confirmed")
        .gte("start_date", today)

      setUpcomingPayments(upcomingCount || 0)

      const { data: completedBookings } = await supabase
        .from("bookings")
        .select("final_amount, total_amount")
        .eq("guest_id", user.id)
        .eq("status", "completed")

      const spent =
        completedBookings?.reduce((sum, booking) => {
          return sum + (booking.final_amount || booking.total_amount || 0)
        }, 0) || 0
      setTotalSpent(spent)

      const { count: favCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      setFavoritesCount(favCount || 0)

      const notifs: string[] = []
      if (upcomingCount && upcomingCount > 0) {
        notifs.push(`You have ${upcomingCount} upcoming booking${upcomingCount > 1 ? "s" : ""}`)
      }
      if (favCount && favCount > 0) {
        notifs.push(`${favCount} space${favCount > 1 ? "s" : ""} in your favorites`)
      }
      setNotifications(notifs)
    } catch (error) {
      console.error("Error fetching renter stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const stats = [
    {
      title: "Total Bookings",
      value: isLoadingStats ? "..." : totalBookings.toString(),
      subtitle: "All time",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Upcoming Rentals",
      value: isLoadingStats ? "..." : upcomingPayments.toString(),
      subtitle: "Confirmed bookings",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Spent",
      value: isLoadingStats ? "..." : formatPrice(totalSpent),
      subtitle: "On completed bookings",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Saved Spaces",
      value: isLoadingStats ? "..." : favoritesCount.toString(),
      subtitle: "In your favorites",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h1>
          <p className="text-gray-600 mt-1">Manage your bookings and discover new spaces.</p>
        </div>
        <Link href="/find-space">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Search className="h-4 w-4 mr-2" />
            Find Spaces
          </Button>
        </Link>
      </div>

      {notifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Notifications</h3>
                <ul className="space-y-1">
                  {notifications.map((notif, index) => (
                    <li key={index} className="text-sm text-blue-800">
                      {notif}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingBookings />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/find-space" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 bg-transparent hover:text-white">
                <Search className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Find Spaces</p>
                  <p className="text-xs text-gray-500">Discover new locations</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/bookings" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 bg-transparent hover:text-white">
                <Calendar className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">My Bookings</p>
                  <p className="text-xs text-gray-500">View all reservations</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/favorites" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 bg-transparent hover:text-white">
                <Heart className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Favorites</p>
                  <p className="text-xs text-gray-500">
                    {favoritesCount} saved space{favoritesCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/profile" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 bg-transparent hover:text-white">
                <MapPin className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Update Profile</p>
                  <p className="text-xs text-gray-500">Manage your account</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Rental Activity</span>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">{upcomingPayments}</p>
              <p className="text-sm text-gray-600">Upcoming Rentals</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalSpent)}</p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
