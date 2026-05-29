"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  MoreHorizontal,
  Users,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building,
  DollarSign,
  ShoppingBag,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  LinkIcon,
  User,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  ImageIcon,
  Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

type UserWithMetrics = {
  id: string
  name: string
  email: string
  joinDate: string
  totalSpaces: number
  totalBookings: number
  totalRevenue: number
  avatar: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  phone: string | null
  website_url: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  bio: string | null
  payout_method: string | null
  is_host: boolean
  is_admin: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
}

type UserStats = {
  totalUsers: number
  activeUsers: number
  totalSpacesListed: number
  totalBookingsReceived: number
  totalRevenueGenerated: number
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<UserWithMetrics[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalSpacesListed: 0,
    totalBookingsReceived: 0,
    totalRevenueGenerated: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const { toast } = useToast()

  const [isSpacesModalOpen, setIsSpacesModalOpen] = useState(false)
  const [selectedUserSpaces, setSelectedUserSpaces] = useState<any[]>([])
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false)
  const [selectedUserInfo, setSelectedUserInfo] = useState<{ name: string; email: string } | null>(null)

  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false)
  const [selectedUserBookings, setSelectedUserBookings] = useState<any[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true)

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_superuser", false)
          .eq("is_admin", false)
          .order("created_at", { ascending: false })

        if (profilesError) {
          console.error("[v0] Error fetching users:", profilesError)
          toast({
            title: "Error Loading Users",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          })
          setIsLoadingUsers(false)
          return
        }

        if (!profiles || profiles.length === 0) {
          setUsers([])
          setIsLoadingUsers(false)
          return
        }

        const usersWithMetrics = await Promise.all(
          profiles.map(async (profile) => {
            const { count: spacesCount } = await supabase
              .from("spaces")
              .select("*", { count: "exact", head: true })
              .eq("host_id", profile.id)

            const { data: userSpaces } = await supabase.from("spaces").select("id").eq("host_id", profile.id)

            const spaceIds = userSpaces?.map((space) => space.id) || []

            let bookingsCount = 0
            let totalRevenue = 0

            if (spaceIds.length > 0) {
              const { count: bookings } = await supabase
                .from("bookings")
                .select("*", { count: "exact", head: true })
                .in("space_id", spaceIds)

              bookingsCount = bookings || 0

              const { data: paidBookings } = await supabase
                .from("bookings")
                .select("final_amount")
                .in("space_id", spaceIds)
                .eq("payment_status", "paid")

              totalRevenue = paidBookings?.reduce((sum, booking) => sum + Number(booking.final_amount), 0) || 0
            }

            const displayName =
              profile.display_name ||
              `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
              profile.email.split("@")[0]

            return {
              id: profile.id,
              name: displayName,
              email: profile.email,
              joinDate: profile.created_at,
              totalSpaces: spacesCount || 0,
              totalBookings: bookingsCount,
              totalRevenue: totalRevenue,
              avatar: profile.profile_image_url,
              first_name: profile.first_name,
              last_name: profile.last_name,
              display_name: profile.display_name,
              phone: profile.phone,
              website_url: profile.website_url,
              address_line1: profile.address_line1,
              address_line2: profile.address_line2,
              city: profile.city,
              state: profile.state,
              zip_code: profile.zip_code,
              country: profile.country,
              bio: profile.bio,
              payout_method: profile.payout_method,
              is_host: profile.is_host,
              is_admin: profile.is_admin,
              is_superuser: profile.is_superuser,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            }
          }),
        )

        setUsers(usersWithMetrics)
        setIsLoadingUsers(false)
      } catch (error) {
        console.error("[v0] Error loading users:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading users.",
          variant: "destructive",
        })
        setIsLoadingUsers(false)
      }
    }

    const loadStats = async () => {
      try {
        setIsLoadingStats(true)

        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_superuser", false)
          .eq("is_admin", false)

        setUserStats((prev) => ({
          ...prev,
          totalUsers: totalUsers || 0,
          activeUsers: totalUsers || 0,
        }))

        setIsLoadingStats(false)
      } catch (error) {
        console.error("[v0] Error loading stats:", error)
        setIsLoadingStats(false)
      }
    }

    loadUsers()
    loadStats()

    const profilesChannel = supabase
      .channel("profiles_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          console.log("[v0] Profile change detected, reloading users")
          loadUsers()
          loadStats()
        },
      )
      .subscribe()

    const spacesChannel = supabase
      .channel("spaces_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        () => {
          console.log("[v0] Space change detected, reloading users")
          loadUsers()
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
          console.log("[v0] Booking change detected, reloading users")
          loadUsers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profilesChannel)
      supabase.removeChannel(spacesChannel)
      supabase.removeChannel(bookingsChannel)
    }
  }, [toast])

  useEffect(() => {
    if (users.length > 0) {
      const totalSpaces = users.reduce((sum, user) => sum + user.totalSpaces, 0)
      const totalBookings = users.reduce((sum, user) => sum + user.totalBookings, 0)
      const totalRevenue = users.reduce((sum, user) => sum + user.totalRevenue, 0)

      setUserStats((prev) => ({
        ...prev,
        totalSpacesListed: totalSpaces,
        totalBookingsReceived: totalBookings,
        totalRevenueGenerated: totalRevenue,
      }))
    }
  }, [users])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value))
    setCurrentPage(1)
  }

  const handleViewProfile = async (userId: string) => {
    try {
      setIsLoadingProfile(true)
      setIsProfileModalOpen(true)

      const supabase = createClient()

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) {
        console.error("[v0] Error fetching user profile:", profileError)
        toast({
          title: "Error Loading Profile",
          description: "Failed to load user profile details.",
          variant: "destructive",
        })
        setIsProfileModalOpen(false)
        return
      }

      const { count: spacesCount } = await supabase
        .from("spaces")
        .select("*", { count: "exact", head: true })
        .eq("host_id", userId)

      const { data: userSpaces } = await supabase.from("spaces").select("id").eq("host_id", userId)

      const spaceIds = userSpaces?.map((space) => space.id) || []

      let bookingsCount = 0
      let totalRevenue = 0

      if (spaceIds.length > 0) {
        const { count: bookings } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .in("space_id", spaceIds)

        bookingsCount = bookings || 0

        const { data: paidBookings } = await supabase
          .from("bookings")
          .select("final_amount")
          .in("space_id", spaceIds)
          .eq("payment_status", "paid")

        totalRevenue = paidBookings?.reduce((sum, booking) => sum + Number(booking.final_amount), 0) || 0
      }

      setSelectedUser({
        ...profile,
        totalSpaces: spacesCount || 0,
        totalBookings: bookingsCount,
        totalRevenue: totalRevenue,
      })
      setIsLoadingProfile(false)
    } catch (error) {
      console.error("[v0] Error loading user profile:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading the profile.",
        variant: "destructive",
      })
      setIsProfileModalOpen(false)
      setIsLoadingProfile(false)
    }
  }

  const handleViewSpaces = async (userId: string, userName: string, userEmail: string) => {
    try {
      setIsLoadingSpaces(true)
      setIsSpacesModalOpen(true)
      setSelectedUserInfo({ name: userName, email: userEmail })
      setSelectedUserSpaces([])

      const supabase = createClient()

      const { data: spaces, error: spacesError } = await supabase
        .from("spaces")
        .select("*")
        .eq("host_id", userId)
        .order("created_at", { ascending: false })

      if (spacesError) {
        console.error("[v0] Error fetching user spaces:", spacesError)
        toast({
          title: "Error Loading Spaces",
          description: "Failed to load user's spaces. Please try again.",
          variant: "destructive",
        })
        setIsSpacesModalOpen(false)
        return
      }

      setSelectedUserSpaces(spaces || [])
      setIsLoadingSpaces(false)
    } catch (error) {
      console.error("[v0] Error loading user spaces:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading spaces.",
        variant: "destructive",
      })
      setIsSpacesModalOpen(false)
      setIsLoadingSpaces(false)
    }
  }

  const handleViewBookings = async (userId: string, userName: string, userEmail: string) => {
    try {
      setIsLoadingBookings(true)
      setIsBookingsModalOpen(true)
      setSelectedUserInfo({ name: userName, email: userEmail })
      setSelectedUserBookings([])

      const supabase = createClient()

      // First, get all spaces owned by this user
      const { data: userSpaces, error: spacesError } = await supabase.from("spaces").select("id").eq("host_id", userId)

      if (spacesError) {
        console.error("[v0] Error fetching user spaces:", spacesError)
        toast({
          title: "Error Loading Bookings",
          description: "Failed to load user's bookings. Please try again.",
          variant: "destructive",
        })
        setIsBookingsModalOpen(false)
        return
      }

      const spaceIds = userSpaces?.map((space) => space.id) || []

      if (spaceIds.length === 0) {
        setSelectedUserBookings([])
        setIsLoadingBookings(false)
        return
      }

      // Get all bookings for these spaces with space details
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          *,
          spaces:space_id (
            title,
            address_line1,
            city,
            state,
            zip_code,
            images
          ),
          guest:guest_id (
            display_name,
            first_name,
            last_name,
            email,
            profile_image_url
          )
        `,
        )
        .in("space_id", spaceIds)
        .order("created_at", { ascending: false })

      if (bookingsError) {
        console.error("[v0] Error fetching bookings:", bookingsError)
        toast({
          title: "Error Loading Bookings",
          description: "Failed to load booking data. Please try again.",
          variant: "destructive",
        })
        setIsBookingsModalOpen(false)
        return
      }

      setSelectedUserBookings(bookings || [])
      setIsLoadingBookings(false)
    } catch (error) {
      console.error("[v0] Error loading user bookings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading bookings.",
        variant: "destructive",
      })
      setIsBookingsModalOpen(false)
      setIsLoadingBookings(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <Badge variant="outline" className="text-sm">
          {filteredUsers.length} of {users.length} users
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Non-admin users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spaces Listed</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalSpacesListed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total spaces by users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings Received</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalBookingsReceived.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total bookings across all spaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${(userStats.totalRevenueGenerated / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-muted-foreground">Cumulative user revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Users</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading users...</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs mt-2">
                {searchTerm ? "Try adjusting your search criteria" : "Users will appear here once they register"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead className="text-center">Spaces Added</TableHead>
                      <TableHead className="text-center">Bookings Received</TableHead>
                      <TableHead className="text-right">Revenue Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar || undefined} alt={user.name} />
                              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {new Date(user.joinDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">{user.totalSpaces}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ShoppingBag className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold text-gray-900">{user.totalBookings}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.totalRevenue > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-bold text-green-600">${user.totalRevenue.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">$0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProfile(user.id)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewSpaces(user.id, user.name, user.email)}>
                                View Spaces
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewBookings(user.id, user.name, user.email)}>
                                View Bookings
                              </DropdownMenuItem>
                              <DropdownMenuItem>Send Message</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}{" "}
                    users
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      aria-label="First page"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNumber)}
                            className="w-9 h-9 p-0"
                            aria-label={`Page ${pageNumber}`}
                            aria-current={currentPage === pageNumber ? "page" : undefined}
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      aria-label="Last page"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Profile Details</DialogTitle>
            <DialogDescription>Comprehensive profile information for administrative oversight</DialogDescription>
          </DialogHeader>

          {isLoadingProfile ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Loading profile...</p>
            </div>
          ) : selectedUser ? (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={selectedUser.profile_image_url || undefined} alt={selectedUser.display_name} />
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-2xl font-semibold">
                    {(selectedUser.display_name || selectedUser.email)
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedUser.display_name ||
                      `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() ||
                      "User"}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {selectedUser.is_host && (
                      <Badge variant="default" className="bg-blue-100 text-blue-700">
                        <Building className="h-3 w-3 mr-1" />
                        Host
                      </Badge>
                    )}
                    {selectedUser.is_admin && (
                      <Badge variant="default" className="bg-purple-100 text-purple-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {selectedUser.is_superuser && (
                      <Badge variant="default" className="bg-red-100 text-red-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Superuser
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Account Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Created</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {new Date(selectedUser.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {new Date(selectedUser.updated_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-sm text-gray-900 mt-1 font-mono">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Role</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedUser.is_superuser
                        ? "Superuser"
                        : selectedUser.is_admin
                          ? "Admin"
                          : selectedUser.is_host
                            ? "Host"
                            : "Guest"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-purple-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-gray-900 mt-1">{selectedUser.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Website</label>
                    <p className="text-gray-900 mt-1">
                      {selectedUser.website_url ? (
                        <a
                          href={selectedUser.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {selectedUser.website_url}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {(selectedUser.address_line1 || selectedUser.city || selectedUser.state) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      Address
                    </h4>
                    <div className="space-y-2">
                      {selectedUser.address_line1 && <p className="text-gray-900">{selectedUser.address_line1}</p>}
                      {selectedUser.address_line2 && <p className="text-gray-900">{selectedUser.address_line2}</p>}
                      <p className="text-gray-900">
                        {[selectedUser.city, selectedUser.state, selectedUser.zip_code].filter(Boolean).join(", ")}
                      </p>
                      {selectedUser.country && <p className="text-gray-900">{selectedUser.country}</p>}
                    </div>
                  </div>
                </>
              )}

              {selectedUser.bio && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Bio</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedUser.bio}</p>
                  </div>
                </>
              )}

              {(selectedUser.linkedin_url ||
                selectedUser.twitter_url ||
                selectedUser.instagram_url ||
                selectedUser.facebook_url) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-purple-600" />
                      Social Media
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedUser.linkedin_url && (
                        <a
                          href={selectedUser.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {selectedUser.twitter_url && (
                        <a
                          href={selectedUser.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors"
                        >
                          <Twitter className="h-4 w-4" />
                          Twitter
                        </a>
                      )}
                      {selectedUser.instagram_url && (
                        <a
                          href={selectedUser.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </a>
                      )}
                      {selectedUser.facebook_url && (
                        <a
                          href={selectedUser.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Platform Activity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{selectedUser.totalSpaces}</p>
                          <p className="text-sm text-gray-500">Spaces Listed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{selectedUser.totalBookings}</p>
                          <p className="text-sm text-gray-500">Bookings Received</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            ${selectedUser.totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">Revenue Generated</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {selectedUser.payout_method && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Payout Information
                    </h4>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payout Method</label>
                      <p className="text-gray-900 mt-1 capitalize">{selectedUser.payout_method.replace("_", " ")}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isSpacesModalOpen} onOpenChange={setIsSpacesModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Spaces</DialogTitle>
            <DialogDescription>
              {selectedUserInfo && (
                <span>
                  Viewing all spaces added by{" "}
                  <span className="font-semibold text-gray-900">{selectedUserInfo.name}</span> ({selectedUserInfo.email}
                  )
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            {isLoadingSpaces ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Loading spaces...</p>
              </div>
            ) : selectedUserSpaces.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium">No spaces found</p>
                <p className="text-xs mt-2">This user hasn't added any spaces yet</p>
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {selectedUserSpaces.map((space, index) => (
                  <Card key={space.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Space Image */}
                        <div className="flex-shrink-0">
                          {space.images && space.images.length > 0 ? (
                            <img
                              src={space.images[0] || "/placeholder.svg"}
                              alt={space.title}
                              className="w-full md:w-32 h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Space Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 leading-tight">{space.title}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{space.description}</p>
                            </div>
                            <Badge
                              variant={space.is_active ? "default" : "secondary"}
                              className={space.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                            >
                              {space.is_active ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Location */}
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-gray-700">Location</p>
                                <p className="text-gray-600">
                                  {space.city}, {space.state} {space.zip_code}
                                </p>
                                {space.address_line1 && (
                                  <p className="text-gray-500 text-xs mt-0.5">{space.address_line1}</p>
                                )}
                              </div>
                            </div>

                            {/* Date Added */}
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-gray-700">Date Added</p>
                                <p className="text-gray-600">
                                  {new Date(space.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                                <p className="text-gray-500 text-xs mt-0.5">
                                  {Math.floor(
                                    (new Date().getTime() - new Date(space.created_at).getTime()) /
                                      (1000 * 60 * 60 * 24),
                                  )}{" "}
                                  days ago
                                </p>
                              </div>
                            </div>

                            {/* Space Type & Capacity */}
                            <div className="flex items-start gap-2">
                              <Building className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-gray-700">Type & Capacity</p>
                                <p className="text-gray-600 capitalize">{space.space_type.replace(/_/g, " ")}</p>
                                {space.capacity && (
                                  <p className="text-gray-500 text-xs mt-0.5">Capacity: {space.capacity} people</p>
                                )}
                              </div>
                            </div>

                            {/* Pricing */}
                            <div className="flex items-start gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm">
                                <p className="font-medium text-gray-700">Pricing</p>
                                {space.price_per_hour && <p className="text-gray-600">${space.price_per_hour}/hour</p>}
                                {space.price_per_day && (
                                  <p className="text-gray-500 text-xs mt-0.5">${space.price_per_day}/day</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex flex-wrap gap-4 pt-2">
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-gray-500">Views:</span>
                              <span className="font-semibold text-gray-900">{space.view_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="text-gray-500">Bookings:</span>
                              <span className="font-semibold text-gray-900">{space.booking_count || 0}</span>
                            </div>
                            {space.rating_average > 0 && (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-gray-500">Rating:</span>
                                <span className="font-semibold text-gray-900">
                                  {space.rating_average.toFixed(1)} ⭐
                                </span>
                                <span className="text-gray-500">({space.rating_count})</span>
                              </div>
                            )}
                            {space.is_featured && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                Featured
                              </Badge>
                            )}
                            {space.instant_book && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Instant Book
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isBookingsModalOpen} onOpenChange={setIsBookingsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Bookings</DialogTitle>
            <DialogDescription>
              {selectedUserInfo && (
                <span>
                  Viewing all bookings received by{" "}
                  <span className="font-semibold text-gray-900">{selectedUserInfo.name}</span> ({selectedUserInfo.email}
                  )
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            {isLoadingBookings ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Loading bookings...</p>
              </div>
            ) : selectedUserBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium">No bookings found</p>
                <p className="text-xs mt-2">This user hasn't received any bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4 pr-4">
                {selectedUserBookings.map((booking) => {
                  const guestName =
                    booking.guest?.display_name ||
                    `${booking.guest?.first_name || ""} ${booking.guest?.last_name || ""}`.trim() ||
                    booking.guest?.email?.split("@")[0] ||
                    "Guest"

                  const statusColors = {
                    pending: "bg-amber-100 text-amber-700 border-amber-200",
                    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
                    completed: "bg-green-100 text-green-700 border-green-200",
                    cancelled: "bg-red-100 text-red-700 border-red-200",
                    refunded: "bg-gray-100 text-gray-700 border-gray-200",
                  }

                  const paymentStatusColors = {
                    pending: "bg-amber-100 text-amber-700",
                    paid: "bg-green-100 text-green-700",
                    failed: "bg-red-100 text-red-700",
                    refunded: "bg-gray-100 text-gray-700",
                  }

                  return (
                    <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Space Image */}
                          <div className="flex-shrink-0">
                            {booking.spaces?.images && booking.spaces.images.length > 0 ? (
                              <img
                                src={booking.spaces.images[0] || "/placeholder.svg"}
                                alt={booking.spaces.title}
                                className="w-full md:w-32 h-32 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Booking Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                  {booking.spaces?.title || "Unknown Space"}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">Booked by {guestName}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Badge
                                  variant="outline"
                                  className={statusColors[booking.status as keyof typeof statusColors]}
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className={
                                    paymentStatusColors[booking.payment_status as keyof typeof paymentStatusColors]
                                  }
                                >
                                  {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                                </Badge>
                              </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Location */}
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-gray-700">Location</p>
                                  <p className="text-gray-600">
                                    {booking.spaces?.city}, {booking.spaces?.state} {booking.spaces?.zip_code}
                                  </p>
                                  {booking.spaces?.address_line1 && (
                                    <p className="text-gray-500 text-xs mt-0.5">{booking.spaces.address_line1}</p>
                                  )}
                                </div>
                              </div>

                              {/* Booking Date */}
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-gray-700">Booking Date</p>
                                  <p className="text-gray-600">
                                    {new Date(booking.start_date).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <p className="text-gray-500 text-xs mt-0.5">
                                    {new Date(booking.start_date).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {new Date(booking.end_date).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>

                              {/* Duration */}
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-gray-700">Duration</p>
                                  <p className="text-gray-600">{booking.total_hours} hours</p>
                                  <p className="text-gray-500 text-xs mt-0.5">{booking.guest_count || 1} guests</p>
                                </div>
                              </div>

                              {/* Revenue */}
                              <div className="flex items-start gap-2">
                                <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <p className="font-medium text-gray-700">Revenue</p>
                                  <p className="text-green-600 font-bold text-lg">
                                    ${Number(booking.final_amount).toLocaleString()}
                                  </p>
                                  <p className="text-gray-500 text-xs mt-0.5">
                                    Base: ${Number(booking.total_amount).toLocaleString()}
                                    {booking.service_fee > 0 && ` + Fee: $${Number(booking.service_fee).toFixed(2)}`}
                                    {booking.tax_amount > 0 && ` + Tax: $${Number(booking.tax_amount).toFixed(2)}`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Booking Details Row */}
                            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-gray-500">Booked on:</span>
                                <span className="font-medium text-gray-900">
                                  {new Date(booking.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-gray-500">Rate:</span>
                                <span className="font-medium text-gray-900">
                                  ${Number(booking.price_per_hour).toFixed(2)}/hour
                                </span>
                              </div>
                              {booking.payment_intent_id && (
                                <div className="flex items-center gap-1 text-sm">
                                  <span className="text-gray-500">Payment ID:</span>
                                  <span className="font-mono text-xs text-gray-600">
                                    {booking.payment_intent_id.slice(0, 20)}...
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Special Requests or Cancellation Reason */}
                            {booking.special_requests && (
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-1">Special Requests:</p>
                                <p className="text-sm text-gray-600 italic">{booking.special_requests}</p>
                              </div>
                            )}

                            {booking.status === "cancelled" && booking.cancellation_reason && (
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-sm font-medium text-red-700 mb-1">Cancellation Reason:</p>
                                <p className="text-sm text-gray-600 italic">{booking.cancellation_reason}</p>
                                {booking.cancelled_at && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Cancelled on:{" "}
                                    {new Date(booking.cancelled_at).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
