"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SpaceTypeSelector from "./space-type-selector"
import ImageUploader from "./image-uploader"
import AddressInput from "./address-input"
import AmenitiesSelector from "./amenities-selector"
import VideoLinkInput from "./video-link-input"
import AvailabilityCalendar from "./availability-calendar"
import { CheckCircle, ArrowRight, ArrowLeft, AlertCircle, Loader2, User, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SpaceFormData {
  spaceType: string
  title: string
  description: string
  capacity: string
  hourlyRate: string
  dailyRate: string
  weeklyRate: string
  monthlyRate: string
  pricingOptions: {
    hourly: boolean
    daily: boolean
    weekly: boolean
    monthly: boolean
  }
  availability: string
  unavailableSlots: Array<{
    id: string
    date: string
    timeRanges: Array<{ start: string; end: string }>
    isRecurring: boolean
    recurringDay?: number
  }>
  houseRules: string
  images: File[]
  videoLink: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  amenities: string[]
  assignedHostId: string
}

interface HostUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_image_url: string | null
}

export default function AdminAddSpaceForm() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hostUsers, setHostUsers] = useState<HostUser[]>([])
  const [isLoadingHosts, setIsLoadingHosts] = useState(true)
  const [hostSearchTerm, setHostSearchTerm] = useState("")
  const [formData, setFormData] = useState<SpaceFormData>({
    spaceType: "",
    title: "",
    description: "",
    capacity: "",
    hourlyRate: "",
    dailyRate: "",
    weeklyRate: "",
    monthlyRate: "",
    pricingOptions: {
      hourly: true,
      daily: true,
      weekly: false,
      monthly: false,
    },
    availability: "24/7",
    unavailableSlots: [],
    houseRules: "",
    images: [] as File[],
    videoLink: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    amenities: [] as string[],
    assignedHostId: "",
  })

  const totalSteps = 5 // Added one step for host selection
  const progress = (currentStep / totalSteps) * 100

  useEffect(() => {
    const loadHostUsers = async () => {
      try {
        const { data: hosts, error } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, display_name, profile_image_url")
          .eq("is_host", true)
          .order("email")

        if (error) throw error

        setHostUsers(hosts || [])
      } catch (err) {
        console.error("[v0] Error loading host users:", err)
        toast({
          title: "Error",
          description: "Failed to load host users. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingHosts(false)
      }
    }

    loadHostUsers()
  }, [supabase, toast])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (error) setError(null)
  }

  const handleAddressChange = (addressData: any) => {
    setFormData((prev) => ({
      ...prev,
      address: addressData,
    }))
    if (error) setError(null)
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateForm = (): string | null => {
    // Host assignment validation
    if (!formData.assignedHostId) return "Please select a host to assign this space to"

    // Step 1 validation
    if (!formData.spaceType) return "Please select a space type"
    if (!formData.title.trim()) return "Please enter a space title"
    if (formData.title.length < 10) return "Title must be at least 10 characters"
    if (!formData.description.trim()) return "Please enter a description"
    if (formData.description.length < 50) return "Description must be at least 50 characters"
    if (!formData.capacity || Number.parseInt(formData.capacity) < 1) return "Please enter a valid capacity"

    // Step 2 validation
    if (!formData.address.street.trim()) return "Please enter a street address"
    if (!formData.address.city.trim()) return "Please enter a city"
    if (!formData.address.state) return "Please select a state"
    if (!formData.address.zipCode.trim()) return "Please enter a ZIP code"
    if (!/^\d{5}(-\d{4})?$/.test(formData.address.zipCode)) return "Please enter a valid ZIP code"

    // Step 3 validation
    if (
      !formData.pricingOptions.hourly &&
      !formData.pricingOptions.daily &&
      !formData.pricingOptions.weekly &&
      !formData.pricingOptions.monthly
    ) {
      return "Please select at least one pricing option"
    }
    if (formData.pricingOptions.hourly && (!formData.hourlyRate || Number.parseFloat(formData.hourlyRate) < 1)) {
      return "Please enter a valid hourly rate"
    }
    if (formData.pricingOptions.daily && (!formData.dailyRate || Number.parseFloat(formData.dailyRate) < 1)) {
      return "Please enter a valid daily rate"
    }
    if (formData.pricingOptions.weekly && (!formData.weeklyRate || Number.parseFloat(formData.weeklyRate) < 1)) {
      return "Please enter a valid weekly rate"
    }
    if (formData.pricingOptions.monthly && (!formData.monthlyRate || Number.parseFloat(formData.monthlyRate) < 1)) {
      return "Please enter a valid monthly rate"
    }

    // Step 4 validation
    if (formData.images.length < 4) {
      return "Please upload at least 4 images of your space (minimum required)"
    }
    if (formData.images.length > 10) {
      return "Maximum 10 images allowed. Please remove some images."
    }

    return null
  }

  const uploadImages = async (hostId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []
    const totalImages = formData.images.length

    for (let i = 0; i < formData.images.length; i++) {
      const file = formData.images[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `${hostId}/${Date.now()}-${i}.${fileExt}`

      setUploadProgress(Math.round(((i + 1) / totalImages) * 50))

      const { data, error } = await supabase.storage.from("space-images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("[v0] Error uploading image:", error)
        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`)
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("space-images").getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      setUploadProgress(0)

      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Starting space creation for host:", formData.assignedHostId)

      const imageUrls = await uploadImages(formData.assignedHostId)
      console.log("[v0] Images uploaded successfully:", imageUrls.length)

      setUploadProgress(60)

      const spaceData = {
        host_id: formData.assignedHostId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.description.trim().substring(0, 200),
        space_type: formData.spaceType,
        address_line1: formData.address.street.trim(),
        address_line2: "",
        city: formData.address.city.trim(),
        state: formData.address.state,
        zip_code: formData.address.zipCode.trim(),
        country: "United States",
        price_per_hour: formData.pricingOptions.hourly ? Number.parseFloat(formData.hourlyRate) : null,
        price_per_day: formData.pricingOptions.daily ? Number.parseFloat(formData.dailyRate) : null,
        price_per_week: formData.pricingOptions.weekly ? Number.parseFloat(formData.weeklyRate) : null,
        price_per_month: formData.pricingOptions.monthly ? Number.parseFloat(formData.monthlyRate) : null,
        capacity: Number.parseInt(formData.capacity),
        amenities: formData.amenities,
        rules: formData.houseRules ? [formData.houseRules] : [],
        images: imageUrls,
        video_url: formData.videoLink || null,
        is_active: true,
        is_featured: false,
        availability_schedule: {
          type: formData.availability,
          unavailableSlots: formData.unavailableSlots,
        },
        instant_book: false,
        minimum_booking_hours: 1,
      }

      console.log("[v0] Creating space in database...")
      setUploadProgress(80)

      const { data: newSpace, error: dbError } = await supabase.from("spaces").insert(spaceData).select().single()

      if (dbError) {
        console.error("[v0] Database error:", dbError)
        throw new Error(`Failed to create space listing: ${dbError.message}`)
      }

      console.log("[v0] Space created successfully:", newSpace.id)
      setUploadProgress(100)

      toast({
        title: "Success!",
        description: "Space has been successfully created and assigned to the host.",
      })

      setTimeout(() => {
        router.push("/admin?tab=spaces")
      }, 1500)
    } catch (err: any) {
      console.error("[v0] Error creating space:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.assignedHostId !== ""
      case 2:
        return (
          formData.spaceType &&
          formData.title &&
          formData.title.length >= 10 &&
          formData.description &&
          formData.description.length >= 50 &&
          formData.capacity
        )
      case 3:
        return formData.address.street && formData.address.city && formData.address.state && formData.address.zipCode
      case 4:
        const hasValidPricingOption =
          (formData.pricingOptions.hourly && formData.hourlyRate) ||
          (formData.pricingOptions.daily && formData.dailyRate) ||
          (formData.pricingOptions.weekly && formData.weeklyRate) ||
          (formData.pricingOptions.monthly && formData.monthlyRate)
        return (
          hasValidPricingOption &&
          (formData.pricingOptions.hourly ||
            formData.pricingOptions.daily ||
            formData.pricingOptions.weekly ||
            formData.pricingOptions.monthly)
        )
      case 5:
        return formData.images.length >= 4 && formData.images.length <= 10
      default:
        return false
    }
  }

  const filteredHosts = hostUsers.filter(
    (host) =>
      host.email.toLowerCase().includes(hostSearchTerm.toLowerCase()) ||
      host.display_name?.toLowerCase().includes(hostSearchTerm.toLowerCase()) ||
      host.first_name?.toLowerCase().includes(hostSearchTerm.toLowerCase()) ||
      host.last_name?.toLowerCase().includes(hostSearchTerm.toLowerCase()),
  )

  const getHostDisplayName = (host: HostUser) => {
    if (host.display_name) return host.display_name
    if (host.first_name && host.last_name) return `${host.first_name} ${host.last_name}`
    if (host.first_name) return host.first_name
    return host.email
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-red-600" />
                Select Host User
              </h3>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Choose which host user this space will be assigned to. Only users with host privileges are shown.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="hostSearch" className="flex items-center gap-1">
                    Search Host <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="hostSearch"
                      placeholder="Search by name or email..."
                      value={hostSearchTerm}
                      onChange={(e) => setHostSearchTerm(e.target.value)}
                      className="pl-10"
                      disabled={isLoadingHosts || isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1 mb-2">
                    Available Hosts ({filteredHosts.length}) <span className="text-red-600">*</span>
                  </Label>
                  <Card className="max-h-96 overflow-y-auto">
                    <CardContent className="p-0">
                      {isLoadingHosts ? (
                        <div className="p-8 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Loading host users...</p>
                        </div>
                      ) : filteredHosts.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">
                          <p>No host users found matching your search.</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredHosts.map((host) => (
                            <button
                              key={host.id}
                              onClick={() => handleInputChange("assignedHostId", host.id)}
                              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                                formData.assignedHostId === host.id ? "bg-green-50 border-l-4 border-green-600" : ""
                              }`}
                              disabled={isSubmitting}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={host.profile_image_url || undefined} />
                                <AvatarFallback>{getHostDisplayName(host).charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium">{getHostDisplayName(host)}</div>
                                <div className="text-sm text-gray-600">{host.email}</div>
                              </div>
                              {formData.assignedHostId === host.id && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        const titleLength = formData.title.length
        const descriptionLength = formData.description.length
        const titleMinLength = 10
        const descriptionMinLength = 50
        const titleValid = titleLength >= titleMinLength
        const descriptionValid = descriptionLength >= descriptionMinLength

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <SpaceTypeSelector
                selectedType={formData.spaceType}
                onTypeSelect={(type) => handleInputChange("spaceType", type)}
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="flex items-center gap-1">
                  Space Title <span className="text-red-600">*</span>
                  <span className="text-red-600 text-xs font-normal">(required)</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Modern Downtown Office Space"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${titleValid ? "text-green-600" : "text-gray-500"}`}>
                    {titleValid ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Title meets minimum length
                      </span>
                    ) : (
                      `Minimum ${titleMinLength} characters required`
                    )}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      titleValid ? "text-green-600" : titleLength > 0 ? "text-amber-600" : "text-gray-400"
                    }`}
                  >
                    {titleLength}/{titleMinLength}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="flex items-center gap-1">
                  Description <span className="text-red-600">*</span>
                  <span className="text-red-600 text-xs font-normal">(required)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your space, its features, and what makes it special..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-1 min-h-[120px]"
                  disabled={isSubmitting}
                />
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${descriptionValid ? "text-green-600" : "text-gray-500"}`}>
                      {descriptionValid ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Description meets minimum length
                        </span>
                      ) : (
                        `Minimum ${descriptionMinLength} characters required`
                      )}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        descriptionValid ? "text-green-600" : descriptionLength > 0 ? "text-amber-500" : "text-gray-400"
                      }`}
                    >
                      {descriptionLength}/{descriptionMinLength}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        descriptionValid ? "bg-green-600" : descriptionLength > 0 ? "bg-amber-500" : "bg-gray-300"
                      }`}
                      style={{
                        width: `${Math.min((descriptionLength / descriptionMinLength) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  {!descriptionValid && descriptionLength > 0 && (
                    <p className="text-xs text-amber-600">
                      {descriptionMinLength - descriptionLength} more character
                      {descriptionMinLength - descriptionLength !== 1 ? "s" : ""} needed
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="capacity" className="flex items-center gap-1">
                  Maximum Capacity <span className="text-red-600">*</span>
                  <span className="text-red-600 text-xs font-normal">(required)</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="e.g., 10"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Location Details</h3>
              <AddressInput address={formData.address} onAddressChange={handleAddressChange} />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Pricing & Availability</h3>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Label className="text-base font-semibold mb-3 flex items-center gap-1">
                  Pricing Options <span className="text-red-600">*</span>
                  <span className="text-red-600 text-xs font-normal">(required)</span>
                </Label>
                <p className="text-sm text-gray-600 mb-3">Select how you want to charge for your space:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="hourlyPricing"
                      checked={formData.pricingOptions.hourly}
                      onChange={(e) =>
                        handleInputChange("pricingOptions", {
                          ...formData.pricingOptions,
                          hourly: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="hourlyPricing" className="text-sm font-medium cursor-pointer">
                      Hourly Pricing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="dailyPricing"
                      checked={formData.pricingOptions.daily}
                      onChange={(e) =>
                        handleInputChange("pricingOptions", {
                          ...formData.pricingOptions,
                          daily: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="dailyPricing" className="text-sm font-medium cursor-pointer">
                      Daily Pricing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="weeklyPricing"
                      checked={formData.pricingOptions.weekly}
                      onChange={(e) =>
                        handleInputChange("pricingOptions", {
                          ...formData.pricingOptions,
                          weekly: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="weeklyPricing" className="text-sm font-medium cursor-pointer">
                      Weekly Pricing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="monthlyPricing"
                      checked={formData.pricingOptions.monthly}
                      onChange={(e) =>
                        handleInputChange("pricingOptions", {
                          ...formData.pricingOptions,
                          monthly: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="monthlyPricing" className="text-sm font-medium cursor-pointer">
                      Monthly Pricing
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {formData.pricingOptions.hourly && (
                  <div>
                    <Label htmlFor="hourlyRate">
                      Hourly Rate <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="25.00"
                        value={formData.hourlyRate}
                        onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                        className="pl-8"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {formData.pricingOptions.daily && (
                  <div>
                    <Label htmlFor="dailyRate">
                      Daily Rate <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <Input
                        id="dailyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="150.00"
                        value={formData.dailyRate}
                        onChange={(e) => handleInputChange("dailyRate", e.target.value)}
                        className="pl-8"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {formData.pricingOptions.weekly && (
                  <div>
                    <Label htmlFor="weeklyRate">
                      Weekly Rate <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <Input
                        id="weeklyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="900.00"
                        value={formData.weeklyRate}
                        onChange={(e) => handleInputChange("weeklyRate", e.target.value)}
                        className="pl-8"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {formData.pricingOptions.monthly && (
                  <div>
                    <Label htmlFor="monthlyRate">
                      Monthly Rate <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <Input
                        id="monthlyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="3000.00"
                        value={formData.monthlyRate}
                        onChange={(e) => handleInputChange("monthlyRate", e.target.value)}
                        className="pl-8"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Label className="text-base font-semibold mb-3">Amenities</Label>
                <AmenitiesSelector
                  selectedAmenities={formData.amenities}
                  onAmenitiesChange={(amenities) => handleInputChange("amenities", amenities)}
                />
              </div>

              <div className="pt-4">
                <AvailabilityCalendar
                  availability={formData.availability}
                  unavailableSlots={formData.unavailableSlots}
                  onAvailabilityChange={(availability) => handleInputChange("availability", availability)}
                  onUnavailableSlotsChange={(slots) => handleInputChange("unavailableSlots", slots)}
                />
              </div>

              <div>
                <Label htmlFor="houseRules">House Rules (Optional)</Label>
                <Textarea
                  id="houseRules"
                  placeholder="Enter any specific rules or guidelines for your space..."
                  value={formData.houseRules}
                  onChange={(e) => handleInputChange("houseRules", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Images & Media</h3>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required:</strong> Upload at least 4 high-quality images (maximum 10). The first image will be
                  used as the cover photo.
                </AlertDescription>
              </Alert>

              <ImageUploader
                images={formData.images}
                onImagesChange={(images) => handleInputChange("images", images)}
                minImages={4}
                maxImages={10}
              />

              <div className="mt-6">
                <VideoLinkInput
                  videoLink={formData.videoLink}
                  onVideoLinkChange={(link) => handleInputChange("videoLink", link)}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-normal text-gray-600">{Math.round(progress)}% Complete</span>
          </CardTitle>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSubmitting && uploadProgress > 0 && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Creating space listing...</p>
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {renderStep()}

          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!isStepValid() || isSubmitting}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Space
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
