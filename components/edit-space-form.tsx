"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import SpaceTypeSelector from "./space-type-selector"
import ImageUploader from "./image-uploader"
import AddressInput from "./address-input"
import AmenitiesSelector from "./amenities-selector"
import VideoLinkInput from "./video-link-input"
import AvailabilityCalendar from "./availability-calendar"
import { CheckCircle, ArrowRight, ArrowLeft, AlertCircle, Loader2, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type Space = Database["public"]["Tables"]["spaces"]["Row"]

interface EditSpaceFormProps {
  space: Space
}

// Pricing option descriptions for help tooltips
const PRICING_DESCRIPTIONS = {
  hourly: "Charge guests on an hourly basis. Ideal for short-term bookings like meeting rooms, office spaces, or day-use facilities.",
  daily: "Charge guests per day (24-hour period). Perfect for accommodations, vacation rentals, or day-use packages.",
  weekly: "Offer weekly rates with potential discounts. Great for longer bookings and encouraging extended stays.",
  monthly: "Provide monthly rates for long-term rentals. Ideal for furnished apartments or spaces rented for extended periods.",
}

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
  existingImages: string[]
  videoLink: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  amenities: string[]
  isActive: boolean
}

export default function EditSpaceForm({ space }: EditSpaceFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<SpaceFormData>({
    spaceType: space.space_type || "",
    title: space.title || "",
    description: space.description || "",
    capacity: space.capacity?.toString() || "",
    hourlyRate: space.price_per_hour?.toString() || "",
    dailyRate: space.price_per_day?.toString() || "",
    weeklyRate: space.price_per_week?.toString() || "",
    monthlyRate: space.price_per_month?.toString() || "",
    pricingOptions: {
      hourly: space.price_per_hour !== null && space.price_per_hour !== undefined,
      daily: space.price_per_day !== null && space.price_per_day !== undefined,
      weekly: space.price_per_week !== null && space.price_per_week !== undefined,
      monthly: space.price_per_month !== null && space.price_per_month !== undefined,
    },
    availability: (space.availability_schedule as any)?.type || "24/7",
    unavailableSlots: (space.availability_schedule as any)?.unavailableSlots || [],
    houseRules: space.rules?.[0] || "",
    images: [] as File[],
    existingImages: space.images || [],
    videoLink: space.video_url || "",
    address: {
      street: space.address_line1 || "",
      city: space.city || "",
      state: space.state || "",
      zipCode: space.zip_code || "",
    },
    amenities: space.amenities || [],
    isActive: space.is_active ?? true,
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

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
    if (!formData.spaceType) return "Please select a space type"
    if (!formData.title.trim()) return "Please enter a space title"
    if (formData.title.length < 10) return "Title must be at least 10 characters"
    if (!formData.description.trim()) return "Please enter a description"
    if (formData.description.length < 50) return "Description must be at least 50 characters"
    if (!formData.capacity || Number.parseInt(formData.capacity) < 1) return "Please enter a valid capacity"
    if (!formData.address.street.trim()) return "Please enter a street address"
    if (!formData.address.city.trim()) return "Please enter a city"
    if (!formData.address.state) return "Please select a state"
    if (!formData.address.zipCode.trim()) return "Please enter a ZIP code"
    if (!/^\d{5}(-\d{4})?$/.test(formData.address.zipCode)) return "Please enter a valid ZIP code"
    
    // Pricing validation - must have at least one option selected
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

    const totalImages = formData.existingImages.length + formData.images.length
    if (totalImages < 4) {
      return `Please have at least 4 images total (currently ${totalImages})`
    }
    if (totalImages > 10) {
      return "Maximum 10 images allowed. Please remove some images."
    }

    return null
  }

  const uploadNewImages = async (userId: string): Promise<string[]> => {
    if (formData.images.length === 0) return []

    const uploadedUrls: string[] = []
    const totalImages = formData.images.length

    for (let i = 0; i < formData.images.length; i++) {
      const file = formData.images[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`

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

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in to update a space listing")
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Starting space update for space:", space.id)

      // Upload new images if any
      let newImageUrls: string[] = []
      if (formData.images.length > 0) {
        newImageUrls = await uploadNewImages(user.id)
      }

      setUploadProgress(60)

      // Combine existing and new images
      const allImages = [...formData.existingImages, ...newImageUrls]

      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.description.trim().substring(0, 200),
        space_type: formData.spaceType,
        address_line1: formData.address.street.trim(),
        city: formData.address.city.trim(),
        state: formData.address.state,
        zip_code: formData.address.zipCode.trim(),
        price_per_hour: formData.pricingOptions.hourly ? Number.parseFloat(formData.hourlyRate) : null,
        price_per_day: formData.pricingOptions.daily ? Number.parseFloat(formData.dailyRate) : null,
        price_per_week: formData.pricingOptions.weekly ? Number.parseFloat(formData.weeklyRate) : null,
        price_per_month: formData.pricingOptions.monthly ? Number.parseFloat(formData.monthlyRate) : null,
        capacity: Number.parseInt(formData.capacity),
        amenities: formData.amenities,
        rules: formData.houseRules ? [formData.houseRules] : [],
        images: allImages,
        video_url: formData.videoLink || null,
        is_active: formData.isActive,
        availability_schedule: {
          type: formData.availability,
          unavailableSlots: formData.unavailableSlots,
        },
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Updating space in database...")
      setUploadProgress(80)

      const { data: updatedSpace, error: dbError } = await supabase
        .from("spaces")
        .update(updateData)
        .eq("id", space.id)
        .eq("host_id", user.id)
        .select()
        .single()

      if (dbError) {
        console.error("[v0] Database error:", dbError)
        throw new Error(`Failed to update space listing: ${dbError.message}`)
      }

      console.log("[v0] Space updated successfully:", updatedSpace.id)
      setUploadProgress(100)

      setTimeout(() => {
        router.push(`/dashboard/my-spaces?updated=${updatedSpace.id}`)
      }, 1000)
    } catch (err: any) {
      console.error("[v0] Error updating space:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.spaceType && formData.title && formData.description && formData.capacity
      case 2:
        return formData.address.street && formData.address.city && formData.address.state && formData.address.zipCode
      case 3:
        return formData.hourlyRate && formData.dailyRate
      case 4:
        return formData.existingImages.length + formData.images.length >= 4
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
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
                <Label htmlFor="title">Space Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Modern Downtown Office Space"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your space, its features, and what makes it special..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-1 min-h-[120px]"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 50 characters ({formData.description.length}/50)</p>
              </div>

              <div>
                <Label htmlFor="capacity">Maximum Capacity *</Label>
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

              <div>
                <Label htmlFor="isActive">Space Status *</Label>
                <select
                  id="isActive"
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(e) => handleInputChange("isActive", e.target.value === "active")}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Location Details</h3>
              <AddressInput address={formData.address} onAddressChange={handleAddressChange} />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Label className="text-base font-semibold mb-3 flex items-center gap-1">
                  Pricing Options <span className="text-red-600">*</span>
                  <span className="text-red-600 text-xs font-normal">(required)</span>
                </Label>
                <p className="text-sm text-gray-600 mb-3">Select how you want to charge for your space:</p>
                <TooltipProvider>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Hourly Pricing */}
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
                      <Label htmlFor="hourlyPricing" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        Hourly Pricing
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>{PRICING_DESCRIPTIONS.hourly}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    {/* Daily Pricing */}
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
                      <Label htmlFor="dailyPricing" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        Daily Pricing
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>{PRICING_DESCRIPTIONS.daily}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    {/* Weekly Pricing */}
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
                      <Label htmlFor="weeklyPricing" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        Weekly Pricing
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>{PRICING_DESCRIPTIONS.weekly}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    {/* Monthly Pricing */}
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
                      <Label htmlFor="monthlyPricing" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        Monthly Pricing
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p>{PRICING_DESCRIPTIONS.monthly}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {/* Rate Inputs */}
              {(formData.pricingOptions.hourly ||
                formData.pricingOptions.daily ||
                formData.pricingOptions.weekly ||
                formData.pricingOptions.monthly) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {formData.pricingOptions.hourly && (
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="25"
                        value={formData.hourlyRate}
                        onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                  {formData.pricingOptions.daily && (
                    <div>
                      <Label htmlFor="dailyRate">Daily Rate ($)</Label>
                      <Input
                        id="dailyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="200"
                        value={formData.dailyRate}
                        onChange={(e) => handleInputChange("dailyRate", e.target.value)}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                  {formData.pricingOptions.weekly && (
                    <div>
                      <Label htmlFor="weeklyRate">Weekly Rate ($)</Label>
                      <Input
                        id="weeklyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="1000"
                        value={formData.weeklyRate}
                        onChange={(e) => handleInputChange("weeklyRate", e.target.value)}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 mt-1">Typically 3-4x the daily rate</p>
                    </div>
                  )}
                  {formData.pricingOptions.monthly && (
                    <div>
                      <Label htmlFor="monthlyRate">Monthly Rate ($)</Label>
                      <Input
                        id="monthlyRate"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="3500"
                        value={formData.monthlyRate}
                        onChange={(e) => handleInputChange("monthlyRate", e.target.value)}
                        className="mt-1"
                        disabled={isSubmitting}
                      />
                      {formData.pricingOptions.weekly && (
                        <p className="text-xs text-gray-500 mt-1">Typically 3-4x the weekly rate</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <AvailabilityCalendar
                  unavailableSlots={formData.unavailableSlots}
                  onSlotsChange={(slots) => handleInputChange("unavailableSlots", slots)}
                />
              </div>

              <div>
                <Label htmlFor="houseRules">House Rules</Label>
                <Textarea
                  id="houseRules"
                  placeholder="Any specific rules or guidelines for your space..."
                  value={formData.houseRules}
                  onChange={(e) => handleInputChange("houseRules", e.target.value)}
                  className="mt-1"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Media & Amenities</h3>

              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Image Requirements:</strong> You must have between 4 and 10 images total.
                  <span className="block mt-1">
                    Current: {formData.existingImages.length + formData.images.length} images
                  </span>
                </AlertDescription>
              </Alert>

              <div className="mb-6">
                <ImageUploader
                  images={formData.images}
                  onImagesChange={(images) => handleInputChange("images", images)}
                  existingImages={formData.existingImages}
                  onExistingImagesChange={(images) => handleInputChange("existingImages", images)}
                />
              </div>

              <div className="mb-6">
                <VideoLinkInput
                  videoLink={formData.videoLink}
                  onVideoLinkChange={(link) => handleInputChange("videoLink", link)}
                />
              </div>

              <div>
                <AmenitiesSelector
                  selectedAmenities={formData.amenities}
                  onAmenitiesChange={(amenities) => handleInputChange("amenities", amenities)}
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>
            Step {currentStep} of {totalSteps}
          </CardTitle>
          <div className="text-sm text-gray-500">{Math.round(progress)}% Complete</div>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Updating your space listing...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-600">
                  {uploadProgress < 50
                    ? "Uploading images..."
                    : uploadProgress < 80
                      ? "Saving to database..."
                      : "Finalizing..."}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {renderStep()}

        <div className="flex justify-between mt-8 pt-6 border-t">
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
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Space
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
