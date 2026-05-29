"use client"

import { useState, useEffect, useCallback } from "react"
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
import AvailabilityCalendar, { validateAvailabilityCalendar } from "./availability-calendar"
import { CheckCircle, ArrowRight, ArrowLeft, AlertCircle, Loader2, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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
}

const STORAGE_KEY = "add-space-form-draft"

// Pricing option descriptions for help tooltips
const PRICING_DESCRIPTIONS = {
  hourly: "Charge guests on an hourly basis. Ideal for short-term bookings like meeting rooms, office spaces, or day-use facilities.",
  daily: "Charge guests per day (24-hour period). Perfect for accommodations, vacation rentals, or day-use packages.",
  weekly: "Offer weekly rates with potential discounts. Great for longer bookings and encouraging extended stays.",
  monthly: "Provide monthly rates for long-term rentals. Ideal for furnished apartments or spaces rented for extended periods.",
}

// Field descriptions for help tooltips
const FIELD_DESCRIPTIONS = {
  maxCapacity: "The maximum number of guests or people who can safely and legally occupy your space at one time. Be accurate as this affects booking availability and guest safety.",
}

// Helper to serialize form data (excluding File objects which can't be stored)
const serializeFormData = (data: SpaceFormData, step: number) => {
  return JSON.stringify({
    ...data,
    images: [], // Files can't be stored in localStorage
    _currentStep: step,
    _savedAt: new Date().toISOString(),
  })
}

// Helper to deserialize form data from localStorage
const deserializeFormData = (stored: string | null): { data: Partial<SpaceFormData>; step: number } | null => {
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored)
    const { _currentStep, _savedAt, ...data } = parsed
    return { data, step: _currentStep || 1 }
  } catch {
    return null
  }
}

export default function AddSpaceForm({ isFreshStart = false }: { isFreshStart?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
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
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  // Load saved form data from localStorage on mount
  useEffect(() => {
    // If this is a fresh start from dashboard, don't restore draft
    if (isFreshStart) {
      setIsHydrated(true)
      return
    }

    const saved = deserializeFormData(localStorage.getItem(STORAGE_KEY))
    if (saved) {
      setFormData((prev) => ({
        ...prev,
        ...saved.data,
        images: [], // Images can't be restored from localStorage
      }))
      setCurrentStep(saved.step)
    }
    setIsHydrated(true)
  }, [isFreshStart])

  // Save form data to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (!isHydrated) return // Don't save until we've loaded existing data
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, serializeFormData(formData, currentStep))
    }, 500) // Debounce saves by 500ms
    
    return () => clearTimeout(timeoutId)
  }, [formData, currentStep, isHydrated])

  // Clear localStorage after successful submission
  const clearSavedDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user makes changes
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
      // Smooth scroll to top for better UX on multi-step form
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      // Smooth scroll to top when navigating back as well
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const validateForm = (): string | null => {
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
    if (
      formData.pricingOptions.hourly &&
      formData.pricingOptions.daily &&
      Number.parseFloat(formData.dailyRate) < Number.parseFloat(formData.hourlyRate) * 4
    ) {
      return "Daily rate should typically be at least 4x the hourly rate"
    }

    // Check for overlapping unavailable date ranges
    const overlapError = validateAvailabilityCalendar(formData.unavailableSlots)
    if (overlapError) {
      return overlapError
    }

    // Step 4 validation - now mandatory with minimum 4 images
    if (formData.images.length < 4) {
      return "Please upload at least 4 images of your space (minimum required)"
    }
    if (formData.images.length > 10) {
      return "Maximum 10 images allowed. Please remove some images."
    }

    return null
  }

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []
    const totalImages = formData.images.length

    for (let i = 0; i < formData.images.length; i++) {
      const file = formData.images[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`

      setUploadProgress(Math.round(((i + 1) / totalImages) * 50)) // First 50% for uploads

      const { data, error } = await supabase.storage.from("space-images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("[v0] Error uploading image:", error)
        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`)
      }

      // Get public URL
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

      // Validate form
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        setIsSubmitting(false)
        return
      }

      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in to create a space listing")
        setIsSubmitting(false)
        return
      }

      // Fetch user profile for name
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, display_name")
        .eq("id", user.id)
        .single()

      const hostName = userProfile?.display_name || `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}`.trim() || "Host"

      // Upload images to Supabase Storage
      const imageUrls = await uploadImages(user.id)

      setUploadProgress(60)

      // Prepare space data
      const spaceData = {
        host_id: user.id,
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
        approval_status: "pending", // New spaces require admin approval
        unavailable_slots: formData.unavailableSlots,
        instant_book: false,
        minimum_booking_hours: 1,
      }

      // Insert into database
      const { data: newSpace, error: dbError } = await supabase.from("spaces").insert(spaceData).select().single()

      if (dbError) {
        throw new Error(`Failed to create space listing: ${dbError.message}`)
      }

      console.log("[v0] Space created successfully:", newSpace.id)
      setUploadProgress(100)
      try {
        await fetch("/api/resend/send-new-space-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceName: formData.title,
            spaceType: formData.spaceType,
            hostName: hostName,
            address: `${formData.address.street}${formData.address.street2 ? ` ${formData.address.street2}` : ""}`,
            city: formData.address.city,
            state: formData.address.state,
            zipCode: formData.address.zipCode,
            capacity: Number.parseInt(formData.capacity),
            hourlyRate: formData.pricingOptions.hourly ? Number.parseFloat(formData.hourlyRate) : undefined,
            dailyRate: formData.pricingOptions.daily ? Number.parseFloat(formData.dailyRate) : undefined,
            weeklyRate: formData.pricingOptions.weekly ? Number.parseFloat(formData.weeklyRate) : undefined,
            monthlyRate: formData.pricingOptions.monthly ? Number.parseFloat(formData.monthlyRate) : undefined,
            description: formData.description,
            amenities: formData.amenities,
            spaceId: newSpace.id,
          }),
        })
      } catch (emailError) {
        // Log email error but don't block user flow
        console.warn("[v0] Failed to send admin notification email:", emailError)
      }
      
      // Clear the saved draft from localStorage after successful submission
      clearSavedDraft()
  
      setTimeout(() => {
        router.push(`/dashboard/my-spaces?new=true&pending=true`)
      }, 1000)
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
        return (
          formData.spaceType &&
          formData.title &&
          formData.title.length >= 10 &&
          formData.description &&
          formData.description.length >= 50 &&
          formData.capacity
        )
      case 2:
        return formData.address.street && formData.address.city && formData.address.state && formData.address.zipCode
      case 3:
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
      case 4:
        return formData.images.length >= 4 && formData.images.length <= 10
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
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
                  {/* Progress bar for description */}
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
                <Label htmlFor="capacity" className="flex items-center gap-1.5">
                  Maximum Capacity <span className="text-red-600">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>{FIELD_DESCRIPTIONS.maxCapacity}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                {!formData.pricingOptions.hourly &&
                  !formData.pricingOptions.daily &&
                  !formData.pricingOptions.weekly &&
                  !formData.pricingOptions.monthly && (
                    <p className="text-xs text-red-600 mt-2">Please select at least one pricing option</p>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {formData.pricingOptions.hourly && (
                  <div>
                    <Label htmlFor="hourlyRate" className="flex items-center gap-1">
                      Hourly Rate ($) <span className="text-red-600">*</span>
                      <span className="text-red-600 text-xs font-normal">(required)</span>
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter hourly rate (e.g., 25)"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                {formData.pricingOptions.daily && (
                  <div>
                    <Label htmlFor="dailyRate" className="flex items-center gap-1">
                      Daily Rate ($) <span className="text-red-600">*</span>
                      <span className="text-red-600 text-xs font-normal">(required)</span>
                    </Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter daily rate (e.g., 200)"
                      value={formData.dailyRate}
                      onChange={(e) => handleInputChange("dailyRate", e.target.value)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    {formData.pricingOptions.hourly && (
                      <p className="text-xs text-gray-500 mt-1">Typically 4-8x the hourly rate</p>
                    )}
                  </div>
                )}
                {formData.pricingOptions.weekly && (
                  <div>
                    <Label htmlFor="weeklyRate" className="flex items-center gap-1">
                      Weekly Rate ($) <span className="text-red-600">*</span>
                      <span className="text-red-600 text-xs font-normal">(required)</span>
                    </Label>
                    <Input
                      id="weeklyRate"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter weekly rate (e.g., 1200)"
                      value={formData.weeklyRate}
                      onChange={(e) => handleInputChange("weeklyRate", e.target.value)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    {formData.pricingOptions.daily && (
                      <p className="text-xs text-gray-500 mt-1">Typically 5-6x the daily rate</p>
                    )}
                  </div>
                )}
                {formData.pricingOptions.monthly && (
                  <div>
                    <Label htmlFor="monthlyRate" className="flex items-center gap-1">
                      Monthly Rate ($) <span className="text-red-600">*</span>
                      <span className="text-red-600 text-xs font-normal">(required)</span>
                    </Label>
                    <Input
                      id="monthlyRate"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter monthly rate (e.g., 4500)"
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
                  <strong>Image Upload Required:</strong> You must upload between 4 and 10 high-quality images of your
                  space to proceed.
                  {formData.images.length > 0 && formData.images.length < 4 && (
                    <span className="block mt-1 text-red-600 font-medium">
                      {4 - formData.images.length} more image{4 - formData.images.length !== 1 ? "s" : ""} required
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="mb-6">
                <ImageUploader
                  images={formData.images}
                  onImagesChange={(images) => handleInputChange("images", images)}
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

              {/* Service Fee Notice */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Service Fee Information</h4>
                    <p className="text-sm text-amber-700">
                      A <span className="font-bold">15% service fee</span> will be deducted from each confirmed booking. 
                      This fee covers payment processing, platform maintenance, customer support, and host protection services.
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      Example: For a $100 booking, you will receive $85 after the service fee.
                    </p>
                  </div>
                </div>
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
        {/* Show draft restored indicator */}
        {isHydrated && localStorage.getItem(STORAGE_KEY) && currentStep === 1 && !isSubmitting && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-800">Your previous progress has been restored.</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSavedDraft()
                  setFormData({
                    spaceType: "",
                    title: "",
                    description: "",
                    capacity: "",
                    hourlyRate: "",
                    dailyRate: "",
                    weeklyRate: "",
    monthlyRate: "",
    pricingOptions: { hourly: true, daily: true, weekly: false, monthly: false },
    unavailableSlots: [],
                    houseRules: "",
                    images: [],
                    videoLink: "",
                    address: { street: "", city: "", state: "", zipCode: "" },
                    amenities: [],
                  })
                  setCurrentStep(1)
                }}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 ml-4"
              >
                Start Fresh
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
                <p className="font-medium">Creating your space listing...</p>
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
            <div className="flex flex-col items-end gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    List My Space
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                By listing, you agree to the 15% service fee on bookings
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
