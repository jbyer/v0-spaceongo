"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, TrendingUp, Plus, Eye, MessageSquare, Star, Building } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"
import UpcomingBookings from "@/components/upcoming-bookings"
import { useCurrency } from "@/contexts/currency-context"

type Space = Database["public"]["Tables"]["spaces"]["Row"]

export default function DashboardOverview() {
  const [mySpaces, setMySpaces] = useState<Space[]>([])
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true)
  const [userName, setUserName] = useState("User")
  const [totalViews, setTotalViews] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [activeBookings, setActiveBookings] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    const fetchUserSpaces = async () => {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoadingSpaces(false)
        setIsLoadingStats(false)
        return
      }

      // Fetch user profile for name
      const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).single()

      if (profile?.first_name) {
        setUserName(profile.first_name)
      }

      const { data: spaces, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)

      if (error) {
        console.error("Error fetching user spaces:", error)
      } else {
        setMySpaces(spaces || [])
      }

      setIsLoadingSpaces(false)

      await fetchUserStats(user.id, supabase)
    }

    fetchUserSpaces()

    const supabase = createClient()
    const channel = supabase
      .channel("user-spaces-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        () => {
          // Refetch spaces when changes occur
          fetchUserSpaces()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchUserStats = async (userId: string, supabase: any) => {
    try {
      setIsLoadingStats(true)

      // Get all user's spaces
      const { data: userSpaces } = await supabase
        .from("spaces")
        .select("id, view_count, rating_average")
        .eq("host_id", userId)

      // Calculate total views
      const views = userSpaces?.reduce((sum: number, space: any) => sum + (space.view_count || 0), 0) || 0
      setTotalViews(views)

      // Calculate average rating across all spaces
      const spacesWithRatings = userSpaces?.filter((space: any) => space.rating_average > 0) || []
      const avgRating =
        spacesWithRatings.length > 0
          ? spacesWithRatings.reduce((sum: number, space: any) => sum + space.rating_average, 0) /
            spacesWithRatings.length
          : 0
      setAverageRating(Number(avgRating.toFixed(1)))

      // Get active bookings count
      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("host_id", userId)
        .in("status", ["pending", "confirmed"])

      setActiveBookings(bookingsCount || 0)

      // Get total earnings from completed bookings
      const { data: completedBookings } = await supabase
        .from("bookings")
        .select("final_amount")
        .eq("host_id", userId)
        .eq("status", "completed")

      const earnings =
        completedBookings?.reduce((sum: number, booking: any) => sum + (booking.final_amount || 0), 0) || 0
      setTotalEarnings(earnings)

      // Stats loaded
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const stats = [
    {
      title: "Total Earnings",
      value: isLoadingStats ? "..." : formatPrice(totalEarnings),
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Bookings",
      value: isLoadingStats ? "..." : activeBookings.toString(),
      change: "+2",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Total Views",
      value: isLoadingStats ? "..." : totalViews.toLocaleString(),
      change: "+18.2%",
      icon: Eye,
      color: "text-purple-600",
    },
    {
      title: "Average Rating",
      value: isLoadingStats ? "..." : averageRating > 0 ? averageRating.toFixed(1) : "N/A",
      change: "+0.2",
      icon: Star,
      color: "text-yellow-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}!</h1>
          <p className="text-gray-600">Here's what's happening with your spaces today.</p>
        </div>
        <Link href="/dashboard/add-space?fresh=true">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Space
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{stat.change}</span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <UpcomingBookings />

        {/* My Spaces */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                My Spaces
              </div>
              <Link href="/dashboard/add-space?fresh=true">
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Space
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSpaces ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : mySpaces.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No spaces yet</h3>
                <p className="text-gray-600 mb-4">Start by adding your first space to get bookings.</p>
                <Link href="/dashboard/add-space?fresh=true">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Your First Space
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {mySpaces.map((space) => (
                    <div key={space.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{space.title}</p>
                        <p className="text-sm text-gray-600">{space.space_type}</p>
                        <div className="flex items-center mt-1 space-x-4">
                          <span className="text-xs text-gray-500">
                            {formatPrice(space.price_per_hour || space.price_per_day)}/{space.price_per_hour ? "hour" : "day"}
                          </span>
                          {space.rating && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="text-xs text-gray-500">{space.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={space.status === "active" ? "default" : "secondary"} className="text-xs">
                          {space.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => (window.location.href = "/dashboard/my-spaces")}
                >
                  Manage All Spaces
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/add-space?fresh=true">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center bg-transparent"
              >
                <Plus className="h-6 w-6 mb-2" />
                Add New Space
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center bg-transparent">
              <MessageSquare className="h-6 w-6 mb-2" />
              Message Guests
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center bg-transparent">
              <TrendingUp className="h-6 w-6 mb-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
