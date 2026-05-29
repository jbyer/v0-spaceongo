"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Users, Calendar, DollarSign, Edit, MoreHorizontal, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import type { Database } from "@/lib/database.types"
import { useCurrency } from "@/contexts/currency-context"

type Space = Database["public"]["Tables"]["spaces"]["Row"]

export default function MySpacesPage() {
  const { formatPrice } = useCurrency()
  const searchParams = useSearchParams()
  const showNewSpaceNotification = searchParams.get("new") === "true" && searchParams.get("pending") === "true"

  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(showNewSpaceNotification)

  const supabase = createClient()

  useEffect(() => {
    async function fetchUserSpaces() {
      try {
        setIsLoading(true)
        setError(null)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Please log in to view your spaces")
          setIsLoading(false)
          return
        }

        // Fetch spaces owned by the current user
        const { data, error: fetchError } = await supabase
          .from("spaces")
          .select("*")
          .eq("host_id", user.id)
          .order("created_at", { ascending: false })

        if (fetchError) {
          console.error("[v0] Error fetching user spaces:", fetchError)
          setError("Failed to load your spaces. Please try again.")
          setIsLoading(false)
          return
        }

        setSpaces(data || [])
        if (data && data.length > 0) {
          setSelectedSpace(data[0])
        }
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Error in fetchUserSpaces:", err)
        setError("An unexpected error occurred")
        setIsLoading(false)
      }
    }

    fetchUserSpaces()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("user-spaces-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        async (payload) => {
          console.log("[v0] Space change detected:", payload)

          // Get current user to filter changes
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (!user) return

          if (payload.eventType === "INSERT" && payload.new) {
            const newSpace = payload.new as Space
            // Only add if it belongs to current user
            if (newSpace.host_id === user.id) {
              setSpaces((prev) => [newSpace, ...prev])
              if (!selectedSpace) {
                setSelectedSpace(newSpace)
              }
            }
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updatedSpace = payload.new as Space
            if (updatedSpace.host_id === user.id) {
              setSpaces((prev) => prev.map((space) => (space.id === updatedSpace.id ? updatedSpace : space)))
              if (selectedSpace?.id === updatedSpace.id) {
                setSelectedSpace(updatedSpace)
              }
            }
          } else if (payload.eventType === "DELETE" && payload.old) {
            const deletedSpace = payload.old as Space
            setSpaces((prev) => prev.filter((space) => space.id !== deletedSpace.id))
            if (selectedSpace?.id === deletedSpace.id) {
              setSelectedSpace(spaces[0] || null)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedSpace, spaces])

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch = space.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" && space.is_active) || (statusFilter === "inactive" && !space.is_active)
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (spaceId: string, newStatus: boolean) => {
    try {
      setUpdatingStatusId(spaceId)

      // Optimistic update
      setSpaces((prev) => prev.map((space) => (space.id === spaceId ? { ...space, is_active: newStatus } : space)))
      if (selectedSpace?.id === spaceId) {
        setSelectedSpace((prev) => (prev ? { ...prev, is_active: newStatus } : null))
      }

      // Update in database - using is_active instead of status
      const { error: updateError } = await supabase.from("spaces").update({ is_active: newStatus }).eq("id", spaceId)

      if (updateError) {
        console.error("[v0] Error updating space status:", updateError)
        // Revert optimistic update on error
        const { data } = await supabase.from("spaces").select("*").eq("id", spaceId).single()
        if (data) {
          setSpaces((prev) => prev.map((space) => (space.id === spaceId ? data : space)))
          if (selectedSpace?.id === spaceId) {
            setSelectedSpace(data)
          }
        }
        alert("Failed to update space status. Please try again.")
      }
    } catch (err) {
      console.error("[v0] Error in handleStatusChange:", err)
      alert("An unexpected error occurred")
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const getApprovalBadge = (approvalStatus: string | null) => {
    switch (approvalStatus) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex flex-1">
          <DashboardSidebar activeTab="spaces" />
          <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading your spaces...</p>
              </div>
            </div>
          </main>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex flex-1">
          <DashboardSidebar activeTab="spaces" />
          <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>Try Again</Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (spaces.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex flex-1">
          <DashboardSidebar activeTab="spaces" />
          <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">My Spaces</h1>
                <Link href="/dashboard/add-space?fresh=true">
                  <Button>Add New Space</Button>
                </Link>
              </div>
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No spaces yet</h3>
                  <p className="text-gray-600 mb-6">Start by adding your first space to begin hosting guests.</p>
                  <Link href="/dashboard/add-space?fresh=true">
                    <Button>Add Your First Space</Button>
                  </Link>
                </CardContent>
              </Card>
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
        <DashboardSidebar activeTab="spaces" />
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">My Spaces</h1>
              <Link href="/dashboard/add-space?fresh=true">
                <Button>Add New Space</Button>
              </Link>
            </div>

            {showNotification && (
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-900">Space submitted successfully!</p>
                    <p className="text-sm text-blue-800">
                      Your space listing is now pending admin review. This typically takes 24-48 hours. You'll receive a
                      notification once your space is approved and live on the platform.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNotification(false)}
                      className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Got it
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search spaces..."
                className="sm:max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredSpaces.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">No spaces match your search criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spaces List */}
                <div className="lg:col-span-1 space-y-4">
                  <h2 className="text-xl font-semibold">Your Spaces ({filteredSpaces.length})</h2>
                  {filteredSpaces.map((space) => (
                    <Card
                      key={space.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSpace?.id === space.id ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => setSelectedSpace(space)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Image
                            src={space.images?.[0] || "/placeholder.svg?height=80&width=80"}
                            alt={space.title || "Space"}
                            width={80}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold truncate flex-1">{space.title}</h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    disabled={updatingStatusId === space.id}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                  {space.is_active === false && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(space.id, true)
                                      }}
                                      disabled={updatingStatusId === space.id}
                                    >
                                      Mark as Active
                                    </DropdownMenuItem>
                                  )}
                                  {space.is_active === true && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(space.id, false)
                                      }}
                                      disabled={updatingStatusId === space.id}
                                    >
                                      Mark as Inactive
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Duplicate</DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Archive</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{space.address_line1}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {space.space_type}
                              </Badge>
                              <div className="flex gap-1">
                                {getApprovalBadge(space.approval_status)}
                                <Badge
                                  className={`text-xs font-medium ${
                                    space.is_active ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-400 hover:bg-gray-500 text-white"
                                  }`}
                                >
                                  {space.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Space Details */}
                <div className="lg:col-span-2">
                  {selectedSpace && (
                    <Tabs defaultValue="details" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="details">Space Details</TabsTrigger>
                        <TabsTrigger value="bookings">Bookings</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details">
                        <Card>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-2xl">{selectedSpace.title}</CardTitle>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                  <MapPin className="h-4 w-4" />
                                  {selectedSpace.address_line1}
                                </div>
                                <div className="mt-2">{getApprovalBadge(selectedSpace.approval_status)}</div>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/dashboard/my-spaces/edit/${selectedSpace.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </Link>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={updatingStatusId === selectedSpace.id}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {selectedSpace.is_active === false && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(selectedSpace.id, true)}
                                        disabled={updatingStatusId === selectedSpace.id}
                                      >
                                        Mark as Active
                                      </DropdownMenuItem>
                                    )}
                                    {selectedSpace.is_active === true && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(selectedSpace.id, false)}
                                        disabled={updatingStatusId === selectedSpace.id}
                                      >
                                        Mark as Inactive
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem>Archive</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {selectedSpace.approval_status === "pending" && (
                              <Alert className="bg-yellow-50 border-yellow-200">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                  <p className="font-medium">Pending Admin Review</p>
                                  <p className="text-sm mt-1">
                                    Your space is currently under review by our admin team. This process typically takes
                                    24-48 hours. Once approved, your space will be visible to potential guests.
                                  </p>
                                </AlertDescription>
                              </Alert>
                            )}

                            {selectedSpace.approval_status === "rejected" && selectedSpace.rejection_reason && (
                              <Alert className="bg-red-50 border-red-200">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                  <p className="font-medium">Space Rejected</p>
                                  <p className="text-sm mt-1">
                                    <strong>Reason:</strong> {selectedSpace.rejection_reason}
                                  </p>
                                  <p className="text-sm mt-2">
                                    Please edit your space listing to address the issues and resubmit for review.
                                  </p>
                                </AlertDescription>
                              </Alert>
                            )}

                            <Image
                              src={selectedSpace.images?.[0] || "/placeholder.svg?height=600&width=300"}
                              alt={selectedSpace.title || "Space"}
                              width={600}
                              height={300}
                              className="w-full h-64 object-cover rounded-lg"
                            />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                                <div className="text-sm text-gray-600">Capacity</div>
                                <div className="font-semibold">{selectedSpace.capacity} people</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
                                <div className="text-sm text-gray-600 mb-2">Pricing</div>
                                <div className="space-y-1">
                                  {selectedSpace.price_per_hour && (
                                    <div className="font-semibold text-xs">
                                      {formatPrice(selectedSpace.price_per_hour, { showUnit: true, unit: "hr" })}
                                    </div>
                                  )}
                                  {selectedSpace.price_per_day && (
                                    <div className="font-semibold text-xs">
                                      {formatPrice(selectedSpace.price_per_day, { showUnit: true, unit: "day" })}
                                    </div>
                                  )}
                                  {selectedSpace.price_per_week && (
                                    <div className="font-semibold text-xs">
                                      {formatPrice(selectedSpace.price_per_week, { showUnit: true, unit: "wk" })}
                                    </div>
                                  )}
                                  {selectedSpace.price_per_month && (
                                    <div className="font-semibold text-xs">
                                      {formatPrice(selectedSpace.price_per_month, { showUnit: true, unit: "mo" })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <MapPin className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                                <div className="text-sm text-gray-600">Type</div>
                                <div className="font-semibold">{selectedSpace.space_type}</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-2">Status</div>
                                <Badge
                                  className={`${
                                    selectedSpace.is_active ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-400 hover:bg-gray-500 text-white"
                                  }`}
                                >
                                  {selectedSpace.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">Description</h3>
                              <p className="text-gray-700">{selectedSpace.description}</p>
                            </div>

                            {selectedSpace.amenities && selectedSpace.amenities.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                  {selectedSpace.amenities.map((amenity, index) => (
                                    <Badge key={index} variant="secondary">
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="bookings">
                        <Card>
                          <CardContent className="p-8 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold mb-2">Bookings Coming Soon</h3>
                            <p className="text-gray-600">
                              Booking functionality will be available once the booking system is implemented.
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
