"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Edit,
  Eye,
  MoreHorizontal,
  MapPin,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  Maximize,
  Star,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  X,
} from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface Space {
  id: string
  title: string
  city: string
  state: string
  host_id: string
  space_type: string
  capacity: number | null
  price_per_day: number | null
  is_active: boolean
  is_featured: boolean
  images: string[] | null
  short_description: string | null
  created_at: string
  updated_at: string // Added for detail view
  profiles?: {
    first_name: string | null
    last_name: string | null
    display_name: string | null
    email: string
    phone?: string | null // Added for detail view
    profile_image_url?: string | null // Added for detail view
    bio?: string | null // Added for detail view
    website_url?: string | null // Added for detail view
    is_host?: boolean // Added for detail view
  }
  // Added fields for detail view
  space_categories?: {
    name: string
    slug: string
    description: string
  }
  description?: string | null
  size_sqft?: number | null
  instant_book?: boolean | null
  cancellation_policy?: string | null
  address_line1?: string | null
  address_line2?: string | null
  zip_code?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  price_per_hour?: number | null
  minimum_booking_hours?: number | null
  maximum_booking_hours?: number | null
  amenities?: string[] | null
  rules?: string[] | null
  rating_average?: number | null
  rating_count?: number | null
  view_count?: number | null
  booking_count?: number | null
  bookingStats?: any[] // Added for detail view
  reviewStats?: any[] // Added for detail view
}

interface EditSpaceData {
  title: string
  short_description: string
  price_per_day: number
  capacity: number
  is_active: boolean
  is_featured: boolean
}

export default function AdminSpacesList() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [editFormData, setEditFormData] = useState<EditSpaceData>({
    title: "",
    short_description: "",
    price_per_day: 0,
    capacity: 0,
    is_active: true,
    is_featured: false,
  })

  const [viewingSpace, setViewingSpace] = useState<Space | null>(null)
  const [spaceDetails, setSpaceDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const { toast } = useToast()

  const fetchSpaces = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = createClient()

      // Calculate offset for pagination
      const offset = (currentPage - 1) * itemsPerPage

      // Fetch total count
      const { count } = await supabase.from("spaces").select("*", { count: "exact", head: true })

      setTotalCount(count || 0)

      // Fetch spaces with pagination
      const { data, error: fetchError } = await supabase
        .from("spaces")
        .select(`
          *,
          profiles:host_id (
            first_name,
            last_name,
            display_name,
            email
          )
        `)
        .range(offset, offset + itemsPerPage - 1)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setSpaces(data as Space[])
    } catch (err) {
      console.error("Error fetching spaces:", err)
      setError("Failed to load spaces. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSpaces()
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("admin_spaces_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        (payload) => {
          console.log("[v0] Space change detected:", payload)
          // Refetch spaces when any change occurs
          fetchSpaces()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentPage, itemsPerPage])

  const filteredSpaces = spaces.filter((space) => {
    const ownerName = space.profiles
      ? `${space.profiles.first_name || ""} ${space.profiles.last_name || ""}`.trim() ||
        space.profiles.display_name ||
        ""
      : ""
    const ownerEmail = space.profiles?.email || ""

    const matchesSearch =
      space.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${space.city}, ${space.state}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && space.is_active) ||
      (statusFilter === "inactive" && !space.is_active)

    const matchesType = typeFilter === "all" || space.space_type.toLowerCase() === typeFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesType
  })

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage

  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1)
    if (filterType === "search") setSearchTerm(value)
    if (filterType === "status") setStatusFilter(value)
    if (filterType === "type") setTypeFilter(value)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space)
    setEditFormData({
      title: space.title,
      short_description: space.short_description || "",
      price_per_day: space.price_per_day || 0,
      capacity: space.capacity || 0,
      is_active: space.is_active,
      is_featured: space.is_featured,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingSpace) return

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.from("spaces").update(editFormData).eq("id", editingSpace.id)

      if (updateError) throw updateError

      setEditingSpace(null)
      // Refetch to get updated data
      await fetchSpaces()
    } catch (err) {
      console.error("Error updating space:", err)
      setError("Failed to update space. Please try again.")
    }
  }

  const handleStatusChange = async (spaceId: string, newStatus: boolean) => {
    try {
      const supabase = createClient()
      const space = spaces.find((s) => s.id === spaceId)

      toast({
        title: newStatus ? "Activating space..." : "Deactivating space...",
        description: "Please wait while we update the space status.",
      })

      const { error: updateError } = await supabase.from("spaces").update({ is_active: newStatus }).eq("id", spaceId)

      if (updateError) throw updateError

      setSpaces(spaces.map((space) => (space.id === spaceId ? { ...space, is_active: newStatus } : space)))

      toast({
        title: newStatus ? "Space activated successfully" : "Space deactivated successfully",
        description: newStatus
          ? `${space?.title} is now visible on the Find Space page.`
          : `${space?.title} has been removed from the Find Space page and is no longer visible to users.`,
        variant: "default",
        duration: 5000,
      })

      console.log(`[v0] Space ${spaceId} ${newStatus ? "activated" : "deactivated"} successfully`)
    } catch (err) {
      console.error("Error updating space status:", err)
      setError("Failed to update space status. Please try again.")

      toast({
        title: "Error updating space status",
        description: "Failed to update space status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleFeatured = async (spaceId: string) => {
    try {
      const supabase = createClient()
      const space = spaces.find((s) => s.id === spaceId)
      if (!space) return

      const { error: updateError } = await supabase
        .from("spaces")
        .update({ is_featured: !space.is_featured })
        .eq("id", spaceId)

      if (updateError) throw updateError

      setSpaces(spaces.map((s) => (s.id === spaceId ? { ...s, is_featured: !s.is_featured } : s)))
    } catch (err) {
      console.error("Error toggling featured status:", err)
      setError("Failed to update featured status. Please try again.")
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? <Badge className="bg-green-500">Active</Badge> : <Badge className="bg-gray-500">Inactive</Badge>
  }

  const handleViewDetails = async (space: Space) => {
    setViewingSpace(space)
    setIsLoadingDetails(true)

    try {
      const supabase = createClient()

      // Fetch comprehensive space details with all related data
      const { data, error } = await supabase
        .from("spaces")
        .select(
          `
          *,
          profiles:host_id (
            id,
            first_name,
            last_name,
            display_name,
            email,
            phone,
            profile_image_url,
            bio,
            website_url,
            is_host
          ),
          space_categories:category_id (
            name,
            slug,
            description
          )
        `,
        )
        .eq("id", space.id)
        .single()

      if (error) throw error

      // Fetch booking statistics
      const { data: bookingStats } = await supabase
        .from("bookings")
        .select("status, total_amount")
        .eq("space_id", space.id)

      // Fetch review statistics
      const { data: reviewStats } = await supabase
        .from("reviews")
        .select("rating")
        .eq("space_id", space.id)
        .eq("review_type", "space_review")

      setSpaceDetails({
        ...data,
        bookingStats: bookingStats || [],
        reviewStats: reviewStats || [],
      })
    } catch (err) {
      console.error("Error fetching space details:", err)
      toast({
        title: "Error loading details",
        description: "Failed to load space details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  if (isLoading && spaces.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Space Management</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading spaces from database...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Space Management</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {totalCount} total spaces
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchSpaces} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, location, or owner..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="conference room">Conference Room</SelectItem>
                <SelectItem value="event space">Event Space</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Spaces Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Space Listings</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rate/Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={space.images?.[0] || "/placeholder.svg?height=60&width=60"}
                          alt={space.title}
                          width={60}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div>
                          <p className="font-medium">{space.title}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="h-3 w-3" />
                            {space.capacity || "N/A"} people
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {space.profiles
                            ? `${space.profiles.first_name || ""} ${space.profiles.last_name || ""}`.trim() ||
                              space.profiles.display_name ||
                              "Unknown"
                            : "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">{space.profiles?.email || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{space.space_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {space.city}, {space.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        {space.price_per_day || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(space.is_active)}</TableCell>
                    <TableCell>
                      <Button
                        variant={space.is_featured ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleFeatured(space.id)}
                        className={space.is_featured ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        {space.is_featured ? "Featured" : "Not Featured"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditSpace(space)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Space
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetails(space)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(space.id, !space.is_active)}
                            className={!space.is_active ? "text-green-600" : "text-red-600"}
                          >
                            {space.is_active ? (
                              <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleFeatured(space.id)}>
                            {space.is_featured ? "Remove from Featured" : "Mark as Featured"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount} entries
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="h-8 w-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Go to:</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value=""
                  onChange={(e) => {
                    const page = Number.parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      handlePageChange(page)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const page = Number.parseInt((e.target as HTMLInputElement).value)
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page)
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                  placeholder="Page"
                  className="w-16 h-8 text-center"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Space Dialog */}
      <Dialog open={!!editingSpace} onOpenChange={() => setEditingSpace(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Space: {editingSpace?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Space Name</Label>
                <Input
                  id="title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editFormData.is_active ? "active" : "inactive"}
                  onValueChange={(value) => setEditFormData({ ...editFormData, is_active: value === "active" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_per_day">Daily Rate ($)</Label>
                <Input
                  id="price_per_day"
                  type="number"
                  value={editFormData.price_per_day}
                  onChange={(e) => setEditFormData({ ...editFormData, price_per_day: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData({ ...editFormData, capacity: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Description</Label>
              <Textarea
                id="short_description"
                value={editFormData.short_description}
                onChange={(e) => setEditFormData({ ...editFormData, short_description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featured">Featured Space</Label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={editFormData.is_featured}
                  onChange={(e) => setEditFormData({ ...editFormData, is_featured: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="featured" className="text-sm font-normal">
                  Display in Featured Spaces section
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSpace(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingSpace} onOpenChange={() => setViewingSpace(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Space Details: {viewingSpace?.title}</span>
              <Button variant="ghost" size="sm" onClick={() => setViewingSpace(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading space details...</p>
              </div>
            </div>
          ) : spaceDetails ? (
            <ScrollArea className="h-[calc(90vh-120px)]">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {/* Images Gallery */}
                  {spaceDetails.images && spaceDetails.images.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Images</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {spaceDetails.images.map((image: string, index: number) => (
                          <Image
                            key={index}
                            src={image || "/placeholder.svg"}
                            alt={`${spaceDetails.title} - Image ${index + 1}`}
                            width={200}
                            height={150}
                            className="rounded-lg object-cover w-full h-32"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-600">Space Title</Label>
                        <p className="font-medium text-lg">{spaceDetails.title}</p>
                      </div>

                      <div>
                        <Label className="text-gray-600">Space Type</Label>
                        <Badge variant="outline" className="mt-1">
                          {spaceDetails.space_type}
                        </Badge>
                      </div>

                      <div>
                        <Label className="text-gray-600">Category</Label>
                        <p className="font-medium">{spaceDetails.space_categories?.name || "Uncategorized"}</p>
                      </div>

                      <div>
                        <Label className="text-gray-600">Status</Label>
                        <div className="mt-1">
                          {spaceDetails.is_active ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-500">Inactive</Badge>
                          )}
                          {spaceDetails.is_featured && <Badge className="ml-2 bg-blue-500">Featured</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-600">Capacity</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{spaceDetails.capacity || "N/A"} people</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-600">Size</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Maximize className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{spaceDetails.size_sqft || "N/A"} sq ft</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-600">Instant Book</Label>
                        <p className="font-medium">{spaceDetails.instant_book ? "Yes" : "No"}</p>
                      </div>

                      <div>
                        <Label className="text-gray-600">Cancellation Policy</Label>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {spaceDetails.cancellation_policy}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-gray-600">Description</Label>
                    <p className="mt-2 text-gray-700 whitespace-pre-wrap">{spaceDetails.description}</p>
                  </div>

                  {/* Host Information */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4">Host Information</h3>
                    <div className="flex items-start gap-4">
                      {spaceDetails.profiles?.profile_image_url && (
                        <Image
                          src={spaceDetails.profiles.profile_image_url || "/placeholder.svg"}
                          alt={spaceDetails.profiles.display_name || "Host"}
                          width={80}
                          height={80}
                          className="rounded-full object-cover"
                        />
                      )}
                      <div className="space-y-2 flex-1">
                        <p className="font-semibold text-lg">
                          {spaceDetails.profiles?.first_name} {spaceDetails.profiles?.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{spaceDetails.profiles?.email}</span>
                        </div>
                        {spaceDetails.profiles?.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{spaceDetails.profiles.phone}</span>
                          </div>
                        )}
                        {spaceDetails.profiles?.website_url && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe className="h-4 w-4" />
                            <a
                              href={spaceDetails.profiles.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {spaceDetails.profiles.website_url}
                            </a>
                          </div>
                        )}
                        {spaceDetails.profiles?.bio && (
                          <p className="text-gray-600 mt-2">{spaceDetails.profiles.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-600">Address Line 1</Label>
                        <p className="font-medium">{spaceDetails.address_line1}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Address Line 2</Label>
                        <p className="font-medium">{spaceDetails.address_line2 || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">City</Label>
                        <p className="font-medium">{spaceDetails.city}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-600">State</Label>
                        <p className="font-medium">{spaceDetails.state}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">ZIP Code</Label>
                        <p className="font-medium">{spaceDetails.zip_code}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Country</Label>
                        <p className="font-medium">{spaceDetails.country}</p>
                      </div>
                    </div>
                  </div>

                  {spaceDetails.latitude && spaceDetails.longitude && (
                    <div className="border-t pt-4">
                      <Label className="text-gray-600">Coordinates</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-sm text-gray-500">Latitude:</span>
                          <p className="font-medium">{spaceDetails.latitude}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Longitude:</span>
                          <p className="font-medium">{spaceDetails.longitude}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Hourly Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-600">${spaceDetails.price_per_hour || "N/A"}</p>
                        <p className="text-sm text-gray-500 mt-1">per hour</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Daily Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-blue-600">${spaceDetails.price_per_day || "N/A"}</p>
                        <p className="text-sm text-gray-500 mt-1">per day</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-semibold text-lg">Booking Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Minimum Booking Hours</Label>
                        <p className="font-medium">{spaceDetails.minimum_booking_hours || 1} hours</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Maximum Booking Hours</Label>
                        <p className="font-medium">{spaceDetails.maximum_booking_hours || "No limit"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Amenities Tab */}
                <TabsContent value="amenities" className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Amenities</h3>
                    {spaceDetails.amenities && spaceDetails.amenities.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {spaceDetails.amenities.map((amenity: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No amenities listed</p>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-lg mb-4">Rules</h3>
                    {spaceDetails.rules && spaceDetails.rules.length > 0 ? (
                      <ul className="space-y-2">
                        {spaceDetails.rules.map((rule: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No rules specified</p>
                    )}
                  </div>
                </TabsContent>

                {/* Statistics Tab */}
                <TabsContent value="statistics" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Rating
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{spaceDetails.rating_average || "0.00"}</p>
                        <p className="text-sm text-gray-500">{spaceDetails.rating_count || 0} reviews</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Views
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{spaceDetails.view_count || 0}</p>
                        <p className="text-sm text-gray-500">total views</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Bookings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{spaceDetails.booking_count || 0}</p>
                        <p className="text-sm text-gray-500">total bookings</p>
                      </CardContent>
                    </Card>
                  </div>

                  {spaceDetails.bookingStats && spaceDetails.bookingStats.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-lg mb-4">Booking Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-600">Total Revenue</Label>
                          <p className="text-2xl font-bold text-green-600">
                            $
                            {spaceDetails.bookingStats
                              .reduce((sum: number, b: any) => sum + (Number.parseFloat(b.total_amount) || 0), 0)
                              .toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-600">Booking Status Breakdown</Label>
                          <div className="space-y-1 mt-2">
                            {["confirmed", "pending", "completed", "cancelled"].map((status) => {
                              const count = spaceDetails.bookingStats.filter((b: any) => b.status === status).length
                              return count > 0 ? (
                                <div key={status} className="flex justify-between text-sm">
                                  <span className="capitalize">{status}:</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ) : null
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-lg mb-4">Timestamps</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Created At</Label>
                        <p className="font-medium">{new Date(spaceDetails.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Last Updated</Label>
                        <p className="font-medium">{new Date(spaceDetails.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
