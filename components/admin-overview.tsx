"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Building,
  Users,
  DollarSign,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getAllActivities } from "@/lib/api/activities"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/lib/database.types"

type UserActivity = Database["public"]["Tables"]["user_activities"]["Row"]

type TopPerformingSpace = {
  id: string
  name: string
  owner: string
  revenue: number
  bookings: number
}

type ActivityItem = {
  id?: string
  type: string
  message: string
  time: string
  status?: "enabled" | "disabled" | "info" | "activity"
  username?: string
}

export default function AdminOverview() {
  const router = useRouter()
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalActivities, setTotalActivities] = useState(0)
  const activitiesPerPage = 5
  const totalPages = Math.ceil(totalActivities / activitiesPerPage)

  const [topSpaces, setTopSpaces] = useState<TopPerformingSpace[]>([])
  const [isLoadingTopSpaces, setIsLoadingTopSpaces] = useState(true)
  const [topSpacesPage, setTopSpacesPage] = useState(1)
  const [totalTopSpaces, setTotalTopSpaces] = useState(0)
  const spacesPerPage = 5
  const totalSpacesPages = Math.ceil(totalTopSpaces / spacesPerPage)

  const [platformStats, setPlatformStats] = useState({
    totalSpaces: 0,
    activeSpaces: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    pendingApprovals: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    Array<{ month: string; revenue: number; bookings: number }>
  >([])
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true)

  const [pendingPayoutRequests, setPendingPayoutRequests] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const loadPlatformStats = async () => {
      try {
        const { count: totalSpaces } = await supabase.from("spaces").select("*", { count: "exact", head: true })

        const { count: activeSpaces } = await supabase
          .from("spaces")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("approval_status", "approved")

        const { count: pendingApprovals } = await supabase
          .from("spaces")
          .select("*", { count: "exact", head: true })
          .eq("approval_status", "pending")

        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

        const { data: bookings } = await supabase.from("bookings").select("final_amount").eq("payment_status", "paid")

        const totalRevenue = bookings?.reduce((sum, booking) => sum + Number(booking.final_amount), 0) || 0

        const { count: pendingPayouts } = await supabase
          .from("payout_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")

        setPlatformStats({
          totalSpaces: totalSpaces || 0,
          activeSpaces: activeSpaces || 0,
          totalUsers: totalUsers || 0,
          totalRevenue,
          monthlyGrowth: 12.5,
          pendingApprovals: pendingApprovals || 0,
        })

        setPendingPayoutRequests(pendingPayouts || 0)

        setIsLoadingStats(false)
      } catch (error) {
        console.error("[v0] Error loading platform stats:", error)
        setIsLoadingStats(false)
      }
    }

    loadPlatformStats()

    const loadInitialActivities = async () => {
      try {
        const { activities, total, error } = await getAllActivities(currentPage, activitiesPerPage)

        if (error) {
          console.error("[v0] Error loading activities:", error)
          setIsLoadingActivities(false)
          return
        }

        const formattedActivities: ActivityItem[] = activities.map((activity) => ({
          id: activity.id,
          type: activity.activity_type,
          message: activity.activity_description,
          time: formatActivityTime(activity.created_at),
          status: "activity",
          username: activity.username || "Unknown User",
        }))

        setRecentActivity(formattedActivities)
        setTotalActivities(total)
        setIsLoadingActivities(false)
      } catch (error) {
        console.error("[v0] Error loading activities:", error)
        setIsLoadingActivities(false)
      }
    }

    loadInitialActivities()

    const loadMonthlyRevenue = async () => {
      try {
        // Fetch all paid bookings from the last 6 months
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("created_at, final_amount")
          .eq("payment_status", "paid")
          .gte("created_at", sixMonthsAgo.toISOString())
          .order("created_at", { ascending: true })

        if (error) {
          console.error("[v0] Error loading monthly revenue:", error)
          setIsLoadingRevenue(false)
          return
        }

        // Group bookings by month and calculate revenue
        const monthlyData: Record<string, { revenue: number; bookings: number; date: Date }> = {}

        bookings?.forEach((booking) => {
          const date = new Date(booking.created_at)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, bookings: 0, date }
          }

          monthlyData[monthKey].revenue += Number(booking.final_amount)
          monthlyData[monthKey].bookings += 1
        })

        // Convert to array and format for chart
        const chartData = Object.entries(monthlyData)
          .map(([key, value]) => ({
            month: value.date.toLocaleDateString("en-US", { month: "short" }),
            revenue: Math.round(value.revenue),
            bookings: value.bookings,
          }))
          .slice(-6) // Keep last 6 months

        // If we have less than 6 months of data, fill in with zeros
        if (chartData.length < 6) {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          const currentMonth = new Date().getMonth()
          const missingMonths = 6 - chartData.length

          for (let i = missingMonths; i > 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12
            chartData.unshift({
              month: monthNames[monthIndex],
              revenue: 0,
              bookings: 0,
            })
          }
        }

        setMonthlyRevenueData(chartData)
        setIsLoadingRevenue(false)
      } catch (error) {
        console.error("[v0] Error loading monthly revenue:", error)
        setIsLoadingRevenue(false)
      }
    }

    loadMonthlyRevenue()

    const loadTopPerformingSpaces = async () => {
      try {
        setIsLoadingTopSpaces(true)

        // Get all spaces with their host information
        const { data: allSpaces, error: spacesError } = await supabase
          .from("spaces")
          .select(
            `
            id,
            title,
            host_id,
            profiles:host_id (
              first_name,
              last_name,
              display_name
            )
          `,
          )
          .eq("is_active", true)

        if (spacesError) {
          console.error("[v0] Error fetching spaces:", spacesError)
          setIsLoadingTopSpaces(false)
          return
        }

        if (!allSpaces || allSpaces.length === 0) {
          setTopSpaces([])
          setTotalTopSpaces(0)
          setIsLoadingTopSpaces(false)
          return
        }

        // Fetch revenue data for each space and calculate totals
        const spacesWithRevenueData = await Promise.all(
          allSpaces.map(async (space) => {
            const { data: bookings } = await supabase
              .from("bookings")
              .select("final_amount")
              .eq("space_id", space.id)
              .eq("payment_status", "paid")

            const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.final_amount), 0) || 0
            const bookingCount = bookings?.length || 0

            const ownerName =
              (space.profiles as any)?.display_name ||
              `${(space.profiles as any)?.first_name || ""} ${(space.profiles as any)?.last_name || ""}`.trim() ||
              "Unknown Owner"

            return {
              id: space.id,
              name: space.title,
              owner: ownerName,
              revenue: totalRevenue,
              bookings: bookingCount,
            }
          }),
        )

        // Sort by revenue descending and take top 20
        const sortedSpaces = spacesWithRevenueData.sort((a, b) => b.revenue - a.revenue).slice(0, 20) // Only keep top 20

        setTotalTopSpaces(sortedSpaces.length)

        // Paginate the results
        const startIndex = (topSpacesPage - 1) * spacesPerPage
        const endIndex = startIndex + spacesPerPage
        setTopSpaces(sortedSpaces.slice(startIndex, endIndex))

        setIsLoadingTopSpaces(false)
      } catch (error) {
        console.error("[v0] Error loading top performing spaces:", error)
        setIsLoadingTopSpaces(false)
      }
    }

    loadTopPerformingSpaces()

    const spacesChannel = supabase
      .channel("spaces_approval_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        async () => {
          const { count: pendingApprovals } = await supabase
            .from("spaces")
            .select("*", { count: "exact", head: true })
            .eq("approval_status", "pending")

          setPlatformStats((prev) => ({
            ...prev,
            pendingApprovals: pendingApprovals || 0,
          }))
        },
      )
      .subscribe()

    const activitiesChannel = supabase
      .channel("user_activities_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_activities",
        },
        (payload) => {
          console.log("[v0] New user activity detected:", payload)

          const activity = payload.new as UserActivity

          let status: ActivityItem["status"] = "activity"
          const metadata = activity.metadata as { status?: string } | null

          if (activity.activity_type === "featured_spaces_toggle") {
            if (metadata?.status === "enabled") status = "enabled"
            else if (metadata?.status === "disabled") status = "disabled"
          }

          const newActivity: ActivityItem = {
            id: activity.id,
            type: activity.activity_type,
            message: activity.activity_description,
            time: "Just now",
            status: status,
            username: activity.username || "Unknown User",
          }

          setRecentActivity((prev) => [newActivity, ...prev].slice(0, 10))
        },
      )
      .subscribe()

    const blogChannel = supabase
      .channel("blog_posts_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blog_posts",
        },
        (payload) => {
          console.log("[v0] New blog post detected:", payload)

          const post = payload.new as any

          if (post.status === "published") {
            const timestamp = new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })

            const newActivity: ActivityItem = {
              type: "blog_post_published",
              message: `New blog post published: "${post.title}"`,
              time: `Just now (${timestamp})`,
              status: "info",
            }

            setRecentActivity((prev) => [newActivity, ...prev].slice(0, 10))
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "blog_posts",
        },
        (payload) => {
          console.log("[v0] Blog post updated:", payload)

          const oldPost = payload.old as any
          const newPost = payload.new as any

          if (oldPost.status === "draft" && newPost.status === "published") {
            const timestamp = new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })

            const newActivity: ActivityItem = {
              type: "blog_post_published",
              message: `Blog post published: "${newPost.title}"`,
              time: `Just now (${timestamp})`,
              status: "info",
            }

            setRecentActivity((prev) => [newActivity, ...prev].slice(0, 10))
          }
        },
      )
      .subscribe()

    const bookingsChannel = supabase
      .channel("bookings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          // Reload revenue data when bookings change
          loadMonthlyRevenue()
        },
      )
      .subscribe()

    const topSpacesChannel = supabase
      .channel("top_spaces_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          // Reload top spaces when bookings change
          loadTopPerformingSpaces()
        },
      )
      .subscribe()

    const payoutRequestsChannel = supabase
      .channel("payout_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payout_requests",
        },
        async (payload) => {
          console.log("[v0] Payout request change detected:", payload)

          // Reload pending count
          const { count: pendingPayouts } = await supabase
            .from("payout_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending")

          setPendingPayoutRequests(pendingPayouts || 0)

          // Add to activity feed if it's a new request
          if (payload.eventType === "INSERT") {
            const request = payload.new as any

            // Fetch user info
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, first_name, last_name")
              .eq("id", request.user_id)
              .single()

            const userName =
              profile?.display_name ||
              `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
              "Unknown User"

            const newActivity: ActivityItem = {
              type: "payout_request",
              message: `${userName} requested a payout of $${Number(request.amount).toFixed(2)}`,
              time: "Just now",
              status: "info",
              username: userName,
            }

            setRecentActivity((prev) => [newActivity, ...prev].slice(0, 10))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(spacesChannel)
      supabase.removeChannel(activitiesChannel)
      supabase.removeChannel(blogChannel)
      supabase.removeChannel(bookingsChannel)
      supabase.removeChannel(topSpacesChannel) // Clean up top spaces subscription
      supabase.removeChannel(payoutRequestsChannel)
    }
  }, [currentPage, topSpacesPage]) // Added topSpacesPage dependency

  const formatActivityTime = (timestamp: string): string => {
    const activityDate = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

    return activityDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIndicator = (status?: string) => {
    switch (status) {
      case "enabled":
        return "bg-green-500"
      case "disabled":
        return "bg-orange-500"
      case "info":
        return "bg-blue-500"
      case "activity":
        return "bg-purple-500"
      default:
        return "bg-blue-500"
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "enabled":
        return <Eye className="h-4 w-4 text-green-600" />
      case "disabled":
        return <EyeOff className="h-4 w-4 text-orange-600" />
      case "info":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "activity":
        return <Activity className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      setIsLoadingActivities(true)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      setIsLoadingActivities(true)
    }
  }

  const handlePreviousTopSpacesPage = () => {
    if (topSpacesPage > 1) {
      setTopSpacesPage(topSpacesPage - 1)
    }
  }

  const handleNextTopSpacesPage = () => {
    if (topSpacesPage < totalSpacesPages) {
      setTopSpacesPage(topSpacesPage + 1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleString()}
        </Badge>
      </div>

      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spaces</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalSpaces.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{platformStats.activeSpaces}</span> active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{platformStats.monthlyGrowth}%</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(platformStats.totalRevenue / 1000000).toFixed(2)}M</div>
              <p className="text-xs text-muted-foreground">All-time platform revenue</p>
            </CardContent>
          </Card>

          <Card
            className={
              platformStats.pendingApprovals > 0
                ? "cursor-pointer hover:shadow-lg hover:bg-orange-50 transition-all duration-200"
                : ""
            }
            onClick={() => {
              if (platformStats.pendingApprovals > 0) {
                router.push("/admin/pending")
              }
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {platformStats.pendingApprovals}
                {platformStats.pendingApprovals > 0 && (
                  <span className="ml-2 inline-flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {platformStats.pendingApprovals > 0 ? "Click to review" : "All caught up!"}
              </p>
            </CardContent>
          </Card>

          {pendingPayoutRequests > 0 && (
            <Card className="border-l-4 border-l-green-500 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Wallet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {pendingPayoutRequests} Payout Request{pendingPayoutRequests !== 1 ? "s" : ""} Pending
                      </p>
                      <p className="text-sm text-gray-600">Review and process user payout requests</p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Navigate to a payout management section (to be created)
                      toast({
                        title: "Coming Soon",
                        description: "Payout management interface will be available in the next update.",
                      })
                    }}
                  >
                    Review Requests
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue & Growth Trend</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly booking revenue over the last 6 months</p>
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Loading revenue data...</p>
                </div>
              </div>
            ) : monthlyRevenueData.length === 0 ||
              monthlyRevenueData.every((d) => d.revenue === 0 && d.bookings === 0) ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium">No revenue data yet</p>
                  <p className="text-xs mt-2">Revenue will appear here once bookings are made</p>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-1))",
                  },
                  bookings: {
                    label: "Bookings",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <div className="grid gap-2">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-sm font-medium">{payload[0].payload.month}</span>
                                </div>
                                <div className="grid gap-1">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]" />
                                    <span className="text-xs text-muted-foreground">Revenue:</span>
                                    <span className="text-sm font-bold">
                                      ${Number(payload[0].value).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]" />
                                    <span className="text-xs text-muted-foreground">Bookings:</span>
                                    <span className="text-sm font-bold">{payload[1].value}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--color-revenue)" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="var(--color-bookings)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: "var(--color-bookings)" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Performing Spaces
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Ranked by total booking revenue</p>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTopSpaces ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Loading top spaces...</p>
              </div>
            ) : topSpaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium">No spaces with bookings yet</p>
                <p className="text-xs mt-2">Top performing spaces will appear here once bookings are made</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {topSpaces.map((space, index) => (
                    <div
                      key={space.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex-shrink-0">
                          {(topSpacesPage - 1) * spacesPerPage + index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{space.name}</p>
                          <p className="text-xs text-gray-600 truncate">
                            <span className="font-medium">Owner:</span> {space.owner}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-green-600 text-sm">${space.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">
                          {space.bookings} booking{space.bookings !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {totalTopSpaces > spacesPerPage && (
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="text-xs text-gray-600">
                      Showing {(topSpacesPage - 1) * spacesPerPage + 1} to{" "}
                      {Math.min(topSpacesPage * spacesPerPage, totalTopSpaces)} of top {totalTopSpaces}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousTopSpacesPage}
                        disabled={topSpacesPage === 1}
                        className="flex items-center gap-1 h-8 px-2 bg-transparent"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1 px-2 text-xs">
                        <span className="font-medium">{topSpacesPage}</span>
                        <span className="text-gray-500">/</span>
                        <span className="font-medium">{totalSpacesPages}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextTopSpacesPage}
                        disabled={topSpacesPage === totalSpacesPages}
                        className="flex items-center gap-1 h-8 px-2 bg-transparent"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading recent activities...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No recent activity to display.</p>
              <p className="text-xs mt-2">Activity notifications will appear here when changes are made.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    role="article"
                    aria-label={`Activity: ${activity.message}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusIndicator(activity.status)}`}
                      aria-hidden="true"
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(activity.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          {activity.username && activity.status === "activity" && (
                            <p className="text-xs text-gray-600 mt-1">by {activity.username}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    {activity.status && (
                      <Badge
                        variant={
                          activity.status === "enabled"
                            ? "default"
                            : activity.status === "disabled"
                              ? "secondary"
                              : activity.status === "info"
                                ? "outline"
                                : "outline"
                        }
                        className={`text-xs flex-shrink-0 ${
                          activity.status === "enabled"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : activity.status === "disabled"
                              ? "bg-orange-100 text-orange-800 border-orange-200"
                              : activity.status === "info"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-purple-100 text-purple-800 border-purple-200"
                        }`}
                      >
                        {activity.status === "enabled"
                          ? "Enabled"
                          : activity.status === "disabled"
                            ? "Disabled"
                            : activity.status === "info"
                              ? "Published"
                              : "User Activity"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {totalActivities > activitiesPerPage && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * activitiesPerPage + 1} to{" "}
                    {Math.min(currentPage * activitiesPerPage, totalActivities)} of {totalActivities} activities
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 bg-transparent"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1 px-3 py-1 text-sm">
                      <span className="font-medium">{currentPage}</span>
                      <span className="text-gray-500">of</span>
                      <span className="font-medium">{totalPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 bg-transparent"
                      aria-label="Next page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
