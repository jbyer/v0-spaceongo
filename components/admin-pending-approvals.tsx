"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, MapPin, Building, Edit2, Save, X, Calendar, Users, DollarSign } from "lucide-react"

type Space = {
  id: string
  title: string
  description: string
  space_type: string
  address_line1: string
  city: string
  state: string
  price_per_hour: number
  price_per_day: number
  capacity: number
  latitude: number | null
  longitude: number | null
  created_at: string
  images: string[]
  host_id: string
  profiles: {
    first_name: string
    last_name: string
    display_name: string
    email: string
  }
}

export default function AdminPendingApprovals() {
  const [pendingSpaces, setPendingSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [isEditingCoordinates, setIsEditingCoordinates] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editedCoordinates, setEditedCoordinates] = useState({ latitude: "", longitude: "" })
  const [editedDetails, setEditedDetails] = useState({ title: "", description: "" })

  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [spaceToReject, setSpaceToReject] = useState<string | null>(null)

  const [processingSpaceId, setProcessingSpaceId] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  const [supabase] = useState(() => createClient())

  useEffect(() => {
    loadPendingSpaces()

    const channel = supabase
      .channel("pending_spaces_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
          filter: "approval_status=eq.pending",
        },
        () => {
          loadPendingSpaces()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadPendingSpaces = async () => {
    try {
      const { data: spaces, error } = await supabase
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
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading pending spaces:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load pending spaces",
        })
        return
      }

      setPendingSpaces(spaces || [])
    } catch (error) {
      console.error("Error loading pending spaces:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (spaceId: string) => {
    setIsApproving(true)
    setProcessingSpaceId(spaceId)

    const spaceToApprove = pendingSpaces.find((s) => s.id === spaceId)

    setPendingSpaces((prev) => prev.filter((space) => space.id !== spaceId))
    setSelectedSpace(null)

    try {
      const { error } = await supabase
        .from("spaces")
        .update({
          approval_status: "approved",
          is_active: true,
        })
        .eq("id", spaceId)

      if (error) throw error

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.rpc("log_user_activity", {
          p_user_id: user.id,
          p_activity_type: "admin_action",
          p_activity_description: `Approved space: ${spaceToApprove?.title || "Unknown Space"}`,
          p_metadata: { space_id: spaceId, action: "approve" },
        })
      }

      toast({
        title: "Space Approved",
        description: "The space has been approved and is now visible to users.",
      })

      await loadPendingSpaces()
    } catch (error) {
      console.error("Error approving space:", error)

      if (spaceToApprove) {
        setPendingSpaces((prev) => [spaceToApprove, ...prev])
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve space. Please try again.",
      })

      await loadPendingSpaces()
    } finally {
      setIsApproving(false)
      setProcessingSpaceId(null)
    }
  }

  const handleReject = (spaceId: string) => {
    setSpaceToReject(spaceId)
    setIsRejecting(true)
    setRejectionReason("")
  }

  const confirmReject = async () => {
    if (!spaceToReject) return

    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please provide a reason for rejecting this space.",
      })
      return
    }

    setProcessingSpaceId(spaceToReject)
    const spaceToRejectData = pendingSpaces.find((s) => s.id === spaceToReject)

    setPendingSpaces((prev) => prev.filter((space) => space.id !== spaceToReject))
    setSelectedSpace(null)
    setIsRejecting(false)

    try {
      const { error: updateError } = await supabase
        .from("spaces")
        .update({
          approval_status: "rejected",
          is_active: false,
        })
        .eq("id", spaceToReject)

      if (updateError) throw updateError

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        if (spaceToRejectData) {
          const { error: messageError } = await supabase.from("messages").insert({
            sender_id: user.id,
            recipient_id: spaceToRejectData.host_id,
            subject: `Space Rejection: ${spaceToRejectData.title}`,
            content: `Your space listing "${spaceToRejectData.title}" has been rejected.\n\nReason: ${rejectionReason}\n\nPlease update your listing according to our guidelines and resubmit, or contact support for more information.`,
            message_type: "system",
            is_read: false,
          })

          if (messageError) {
            console.error("Error sending rejection message:", messageError)
          }
        }

        await supabase.rpc("log_user_activity", {
          p_user_id: user.id,
          p_activity_type: "admin_action",
          p_activity_description: `Rejected space: ${spaceToRejectData?.title || "Unknown Space"}`,
          p_metadata: { space_id: spaceToReject, action: "reject", reason: rejectionReason },
        })
      }

      toast({
        title: "Space Rejected",
        description: "The space has been rejected and the owner has been notified.",
      })

      await loadPendingSpaces()
    } catch (error) {
      console.error("Error rejecting space:", error)

      if (spaceToRejectData) {
        setPendingSpaces((prev) => [spaceToRejectData, ...prev])
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject space. Please try again.",
      })

      await loadPendingSpaces()
    } finally {
      setProcessingSpaceId(null)
      setSpaceToReject(null)
    }
  }

  const handleUpdateCoordinates = async () => {
    if (!selectedSpace) return

    const lat = Number.parseFloat(editedCoordinates.latitude)
    const lng = Number.parseFloat(editedCoordinates.longitude)

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        variant: "destructive",
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values.",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("spaces")
        .update({
          latitude: lat,
          longitude: lng,
        })
        .eq("id", selectedSpace.id)

      if (error) throw error

      toast({
        title: "Coordinates Updated",
        description: "The geographic coordinates have been successfully updated.",
      })

      setSelectedSpace({ ...selectedSpace, latitude: lat, longitude: lng })
      setIsEditingCoordinates(false)
      loadPendingSpaces()
    } catch (error) {
      console.error("Error updating coordinates:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update coordinates",
      })
    }
  }

  const handleUpdateDetails = async () => {
    if (!selectedSpace) return

    if (!editedDetails.title.trim() || !editedDetails.description.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Title and description cannot be empty.",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("spaces")
        .update({
          title: editedDetails.title,
          description: editedDetails.description,
        })
        .eq("id", selectedSpace.id)

      if (error) throw error

      toast({
        title: "Details Updated",
        description: "The space details have been successfully updated.",
      })

      setSelectedSpace({ ...selectedSpace, title: editedDetails.title, description: editedDetails.description })
      setIsEditingDetails(false)
      loadPendingSpaces()
    } catch (error) {
      console.error("Error updating details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update details",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending approvals...</p>
        </div>
      </div>
    )
  }

  if (pendingSpaces.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">There are no pending space approvals at this time.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Approvals</h2>
        <p className="text-gray-600">Review and approve new space listings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pendingSpaces.map((space) => (
          <Card
            key={space.id}
            className={`overflow-hidden hover:shadow-lg transition-all ${
              processingSpaceId === space.id ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="aspect-video relative bg-gray-200">
              {space.images && space.images.length > 0 ? (
                <img
                  src={space.images[0] || "/placeholder.svg"}
                  alt={space.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <Badge className="absolute top-2 right-2 bg-orange-500">{space.space_type}</Badge>
              {processingSpaceId === space.id && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            <CardHeader>
              <CardTitle className="line-clamp-1">{space.title}</CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{space.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">
                    {space.city}, {space.state}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {space.capacity}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    ${space.price_per_hour}/hr · ${space.price_per_day}/day
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(space.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-1">Owner</p>
                <p className="text-sm font-medium">
                  {space.profiles.display_name ||
                    `${space.profiles.first_name} ${space.profiles.last_name}`.trim() ||
                    space.profiles.email}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => setSelectedSpace(space)}
                disabled={processingSpaceId === space.id}
              >
                Review Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isRejecting} onOpenChange={(open) => !open && setIsRejecting(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Space Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this space. This message will be sent to the space owner.
            </p>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Missing high-quality images, incomplete description, etc."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsRejecting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={processingSpaceId !== null}>
              {processingSpaceId ? "Rejecting..." : "Reject Space"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedSpace !== null} onOpenChange={() => setSelectedSpace(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSpace && (
            <>
              <DialogHeader>
                <DialogTitle>Review Space Listing</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {selectedSpace.images && selectedSpace.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSpace.images.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img || "/placeholder.svg"}
                        alt={`Space ${idx + 1}`}
                        className="w-full h-48 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Space Details</h3>
                    {!isEditingDetails ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingDetails(true)
                          setEditedDetails({
                            title: selectedSpace.title,
                            description: selectedSpace.description,
                          })
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdateDetails}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditingDetails ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                          id="edit-title"
                          value={editedDetails.title}
                          onChange={(e) => setEditedDetails({ ...editedDetails, title: e.target.value })}
                          placeholder="Enter space title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={editedDetails.description}
                          onChange={(e) => setEditedDetails({ ...editedDetails, description: e.target.value })}
                          placeholder="Enter space description"
                          rows={4}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-gray-600">Title</Label>
                        <p className="font-medium">{selectedSpace.title}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Description</Label>
                        <p className="text-sm">{selectedSpace.description}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Space Type</Label>
                    <p className="font-medium">{selectedSpace.space_type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Capacity</Label>
                    <p className="font-medium">{selectedSpace.capacity} people</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Price per Hour</Label>
                    <p className="font-medium">${selectedSpace.price_per_hour}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Price per Day</Label>
                    <p className="font-medium">${selectedSpace.price_per_day}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600">Address</Label>
                  <p className="font-medium">
                    {selectedSpace.address_line1}, {selectedSpace.city}, {selectedSpace.state}
                  </p>
                </div>

                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Geographic Coordinates</h3>
                    {!isEditingCoordinates ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingCoordinates(true)
                          setEditedCoordinates({
                            latitude: selectedSpace.latitude?.toString() || "",
                            longitude: selectedSpace.longitude?.toString() || "",
                          })
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditingCoordinates(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdateCoordinates}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditingCoordinates ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.000001"
                          value={editedCoordinates.latitude}
                          onChange={(e) => setEditedCoordinates({ ...editedCoordinates, latitude: e.target.value })}
                          placeholder="e.g., 40.7128"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="0.000001"
                          value={editedCoordinates.longitude}
                          onChange={(e) => setEditedCoordinates({ ...editedCoordinates, longitude: e.target.value })}
                          placeholder="e.g., -74.0060"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Latitude</Label>
                        <p className="font-medium">{selectedSpace.latitude || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Longitude</Label>
                        <p className="font-medium">{selectedSpace.longitude || "Not set"}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedSpace.id)}
                    disabled={isApproving || processingSpaceId !== null}
                  >
                    {isApproving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Space
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReject(selectedSpace.id)}
                    disabled={processingSpaceId !== null}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Space
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
