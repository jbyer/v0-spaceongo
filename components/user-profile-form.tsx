"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, MapPin, Globe, Save, Camera, Upload, X, CheckCircle2, AlertCircle, Users, Home } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export default function UserProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    username: "",
    email: "",
    phone: "",
    bio: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    neighbor: "",
    website: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    facebook: "",
    airbnb: "",
    pinterest: "",
    payoutMethod: "paypal",
    userRole: "renter" as "renter" | "host",
  })

  const [profilePicture, setProfilePicture] = useState<string>("/professional-profile.png")
  const [isUploadingPicture, setIsUploadingPicture] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [usernameValidationMessage, setUsernameValidationMessage] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setErrorMessage("Please log in to view your profile")
        return
      }

      console.log("[v0] Loading profile for user:", user.id)
      const userMetadata = user.user_metadata
      const isOAuthUser = user.app_metadata?.provider === "google" || user.app_metadata?.provider === "linkedin_oidc"

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Error loading profile:", profileError)
        setErrorMessage("Failed to load profile data")
        return
      }

      if (!profileData) {
        console.warn("[v0] No profile found for user:", user.id)
        setErrorMessage("Profile not found. Please complete your registration.")
        return
      }

      // Ensure profile has email - fallback to auth user email if missing
      const profileEmail = profileData.email || user.email || ""
      if (!profileEmail) {
        console.warn("[v0] No email found for user:", user.id)
        setErrorMessage("Email not found. Please contact support.")
        return
      }

      // Update profile with auth email if it's missing or different
      if (!profileData.email || profileData.email !== user.email) {
        console.log("[v0] Syncing email from auth user to profile")
        const { error: emailSyncError } = await supabase
          .from("profiles")
          .update({ email: user.email })
          .eq("id", user.id)

        if (emailSyncError) {
          console.error("[v0] Error syncing email to profile:", emailSyncError)
        } else {
          // Reload profile to get updated email
          const { data: updatedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
          if (updatedProfile) {
            profileData.email = updatedProfile.email
          }
        }
      }

      if (isOAuthUser && userMetadata && (!profileData.first_name || !profileData.profile_image_url)) {
        console.log("[v0] Syncing OAuth profile data from user metadata")

        const firstName =
          userMetadata.given_name ||
          userMetadata.first_name ||
          userMetadata.full_name?.split(" ")[0] ||
          profileData.first_name
        const lastName =
          userMetadata.family_name ||
          userMetadata.last_name ||
          userMetadata.full_name?.split(" ").slice(1).join(" ") ||
          profileData.last_name
        const profilePicture = userMetadata.avatar_url || userMetadata.picture || profileData.profile_image_url
        const displayName = userMetadata.full_name || `${firstName} ${lastName}`.trim() || profileData.display_name

        // Update profile with OAuth data if missing
        const { error: syncError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName || profileData.first_name,
            last_name: lastName || profileData.last_name,
            display_name: displayName || profileData.display_name,
            profile_image_url: profilePicture || profileData.profile_image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (syncError) {
          console.error("[v0] Error syncing OAuth profile:", syncError)
        } else {
          console.log("[v0] Successfully synced OAuth profile data")
          // Reload profile data after sync
          const { data: updatedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

          if (updatedProfile) {
            setProfile(updatedProfile)

            // Populate form with synced OAuth data
            setFormData({
              firstName: updatedProfile.first_name || "",
              lastName: updatedProfile.last_name || "",
              displayName: updatedProfile.display_name || "",
              username: updatedProfile.username || "",
              email: updatedProfile.email || "",
              phone: updatedProfile.phone || "",
              bio: updatedProfile.bio || "",
              address: updatedProfile.address_line1 || "",
              city: updatedProfile.city || "",
              state: updatedProfile.state || "",
              zipCode: updatedProfile.zip_code || "",
              country: updatedProfile.country || "United States",
              neighbor: updatedProfile.neighbor || "",
              website: updatedProfile.website_url || "",
              instagram: updatedProfile.instagram_url || "",
              twitter: updatedProfile.twitter_url || "",
              linkedin: updatedProfile.linkedin_url || "",
              facebook: updatedProfile.facebook_url || "",
              airbnb: updatedProfile.airbnb_url || "",
              pinterest: updatedProfile.pinterest_url || "",
              payoutMethod: updatedProfile.payout_method || "paypal",
            })

            if (updatedProfile.profile_image_url) {
              setProfilePicture(updatedProfile.profile_image_url)
            }

            return
          }
        }
      }

      setProfile(profileData)

      // Populate form with existing data
      setFormData({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        displayName: profileData.display_name || "",
        username: profileData.username || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        bio: profileData.bio || "",
        address: profileData.address_line1 || "",
        city: profileData.city || "",
        state: profileData.state || "",
        zipCode: profileData.zip_code || "",
        country: profileData.country || "United States",
        neighbor: profileData.neighbor || "",
        website: profileData.website_url || "",
        instagram: profileData.instagram_url || "",
        twitter: profileData.twitter_url || "",
        linkedin: profileData.linkedin_url || "",
        facebook: profileData.facebook_url || "",
        airbnb: profileData.airbnb_url || "",
        pinterest: profileData.pinterest_url || "",
        payoutMethod: profileData.payout_method || "paypal",
        userRole: profileData.is_host ? "host" : "renter",
      })

      if (profileData.profile_image_url) {
        setProfilePicture(profileData.profile_image_url)
      }
    } catch (error) {
      console.error("[v0] Error in loadProfile:", error)
      setErrorMessage("An unexpected error occurred")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5MB")
      return
    }

    setIsUploadingPicture(true)
    setErrorMessage("")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setErrorMessage("Please log in to upload a profile picture")
        return
      }

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePicture(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from("profile-images").upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        setErrorMessage("Failed to upload image. Please try again.")
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(filePath)

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_image_url: publicUrl })
        .eq("id", user.id)

      if (updateError) {
        console.error("[v0] Profile update error:", updateError)
        setErrorMessage("Failed to update profile picture")
        return
      }

      setProfilePicture(publicUrl)
      setSuccessMessage("Profile picture updated successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error uploading profile picture:", error)
      setErrorMessage("An unexpected error occurred")
    } finally {
      setIsUploadingPicture(false)
    }
  }

  const handleRemoveProfilePicture = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Update profile to remove image URL
      const { error } = await supabase.from("profiles").update({ profile_image_url: null }).eq("id", user.id)

      if (error) {
        console.error("[v0] Error removing profile picture:", error)
        setErrorMessage("Failed to remove profile picture")
        return
      }

      setProfilePicture("/professional-profile.png")
      setSuccessMessage("Profile picture removed successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("[v0] Error in handleRemoveProfilePicture:", error)
      setErrorMessage("An unexpected error occurred")
    }
  }

  const validateUsername = async (username: string) => {
    // Clear previous validation message
    setUsernameValidationMessage(null)

    // If username is empty, don't validate
    if (!username.trim()) {
      return
    }

    // Check format first (client-side)
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/
    if (!usernameRegex.test(username)) {
      setUsernameValidationMessage({
        type: "error",
        message: "Username must start with a letter and contain only letters, numbers, underscores, or hyphens",
      })
      return
    }

    if (username.length < 3) {
      setUsernameValidationMessage({
        type: "error",
        message: "Username must be at least 3 characters long",
      })
      return
    }

    if (username.length > 20) {
      setUsernameValidationMessage({
        type: "error",
        message: "Username must be no more than 20 characters long",
      })
      return
    }

    // Check availability (server-side)
    setIsCheckingUsername(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Check if username is already taken by another user
      const { data: existingUser, error } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", username)
        .neq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error("[v0] Error checking username:", error)
        return
      }

      if (existingUser) {
        setUsernameValidationMessage({
          type: "error",
          message: "This username is already taken",
        })
      } else {
        setUsernameValidationMessage({
          type: "success",
          message: "Username is available!",
        })
      }
    } catch (error) {
      console.error("[v0] Error in validateUsername:", error)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username && formData.username !== profile?.username) {
        validateUsername(formData.username)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [formData.username])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required field validation
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (formData.username) {
      const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/
      if (!usernameRegex.test(formData.username)) {
        newErrors.username =
          "Username must start with a letter and contain only letters, numbers, underscores, or hyphens"
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters long"
      } else if (formData.username.length > 20) {
        newErrors.username = "Username must be no more than 20 characters long"
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone) {
      const phoneRegex = /^\+?[\d\s\-()]+$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number"
      }
    }

    // Website validation
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = "Website must start with http:// or https://"
    }

    // Social media URL validation
    const urlRegex = /^https?:\/\/.+/

    if (formData.facebook && !urlRegex.test(formData.facebook)) {
      newErrors.facebook = "Facebook URL must start with http:// or https://"
    }

    if (formData.airbnb && !urlRegex.test(formData.airbnb)) {
      newErrors.airbnb = "Airbnb URL must start with http:// or https://"
    }

    if (formData.pinterest && !urlRegex.test(formData.pinterest)) {
      newErrors.pinterest = "Pinterest URL must start with http:// or https://"
    }

    // ZIP code validation (US format)
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid ZIP code"
    }

    // Neighbor field validation
    if (formData.neighbor && formData.neighbor.length > 100) {
      newErrors.neighbor = "Neighbor information must be less than 100 characters"
    }

    // Bio length validation
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    // Clear messages when user makes changes
    if (successMessage) setSuccessMessage("")
    if (errorMessage) setErrorMessage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setErrorMessage("Please fix the errors before saving")
      return
    }

    if (isCheckingUsername) {
      setErrorMessage("Please wait while we check username availability")
      return
    }

    if (usernameValidationMessage?.type === "error") {
      setErrorMessage("Please fix the username error before saving")
      return
    }

    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const supabase = createClient()

      // Verify user authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setErrorMessage("Please log in to update your profile")
        setIsLoading(false)
        return
      }

      // Prepare update data with proper field mapping
      const updateData: ProfileUpdate = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        display_name: formData.displayName.trim() || `${formData.firstName} ${formData.lastName}`,
        username: formData.username.trim() || null,
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        address_line1: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zipCode.trim() || null,
        country: formData.country.trim(),
        neighbor: formData.neighbor.trim() || null,
        website_url: formData.website.trim() || null,
        instagram_url: formData.instagram.trim() || null,
        twitter_url: formData.twitter.trim() || null,
        linkedin_url: formData.linkedin.trim() || null,
        facebook_url: formData.facebook.trim() || null,
        airbnb_url: formData.airbnb.trim() || null,
        pinterest_url: formData.pinterest.trim() || null,
        payout_method: formData.payoutMethod as "paypal" | "skrill" | "wire_transfer",
        is_host: formData.userRole === "host",
        updated_at: new Date().toISOString(),
      }

      // Clean up any stale profiles with this email but different user ID
      if (updateData.email) {
        const { data: staleProfiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", updateData.email)
          .neq("id", user.id)

        if (staleProfiles && staleProfiles.length > 0) {
          console.log("[v0] Deleting stale profiles with same email:", staleProfiles.map((p) => p.id))
          await supabase
            .from("profiles")
            .delete()
            .eq("email", updateData.email)
            .neq("id", user.id)
        }
      }

      // Update or create profile using upsert
      const { data: upsertedProfile, error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          ...updateData,
        })
        .select()
        .maybeSingle()

      if (upsertError) {
        console.error("[v0] Profile upsert error:", upsertError)
        if (upsertError.code === "23505" && upsertError.message.includes("username")) {
          setErrorMessage("This username is already taken. Please choose a different one.")
        } else {
          setErrorMessage("Failed to save profile. Please try again.")
        }
        return
      }

      // Update local state with fresh data
      if (upsertedProfile) {
        setProfile(upsertedProfile)
        setSuccessMessage("Profile saved successfully!")
        setTimeout(() => setSuccessMessage(""), 5000)
      }
    } catch (error) {
      console.error("[v0] Error in handleSubmit:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Role
          </CardTitle>
          <CardDescription>Select your primary role on SpaceOnGo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-base font-medium">I want to</Label>
            <RadioGroup
              value={formData.userRole}
              onValueChange={(value) => handleInputChange("userRole", value as "renter" | "host")}
            >
              <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                <RadioGroupItem value="renter" id="renter-role" />
                <Label htmlFor="renter-role" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-base">Rent spaces</div>
                    <div className="text-sm text-gray-600">Find and book amazing spaces for your needs</div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                <RadioGroupItem value="host" id="host-role" />
                <Label htmlFor="host-role" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="flex-shrink-0">
                    <Home className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-base">List my space</div>
                    <div className="text-sm text-gray-600">Share your space and earn money</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Your role preference helps us personalize your dashboard experience. You can change this anytime.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>Upload a professional photo to help guests recognize you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Profile Picture Preview */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                <img src={profilePicture || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
              </div>
              {profilePicture !== "/professional-profile.png" && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePicture}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="profilePicture" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-fit">
                    {isUploadingPicture ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Choose Photo
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={isUploadingPicture}
                />
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <p>• Upload a clear, professional photo</p>
                <p>• JPG, PNG, or GIF format</p>
                <p>• Maximum file size: 5MB</p>
                <p>• Square images work best</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value.toLowerCase())}
                placeholder="Choose a unique username"
                className={errors.username ? "border-red-500" : ""}
                maxLength={20}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
            {usernameValidationMessage && !errors.username && (
              <p
                className={`text-sm mt-1 flex items-center gap-1 ${
                  usernameValidationMessage.type === "success"
                    ? "text-green-600"
                    : usernameValidationMessage.type === "error"
                      ? "text-red-600"
                      : "text-blue-600"
                }`}
              >
                {usernameValidationMessage.type === "success" && <CheckCircle2 className="h-3 w-3" />}
                {usernameValidationMessage.type === "error" && <AlertCircle className="h-3 w-3" />}
                {usernameValidationMessage.message}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              3-20 characters. Must start with a letter. Only letters, numbers, underscores, and hyphens allowed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself and your hosting experience..."
              className="min-h-[100px]"
            />
            <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
          <CardDescription>Your address information for billing and verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                className={errors.zipCode ? "border-red-500" : ""}
              />
              {errors.zipCode && <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>}
            </div>
          </div>

          {/* Neighbor field with proper spacing and validation */}
          <div>
            <Label htmlFor="neighbor">Neighbor</Label>
            <Input
              id="neighbor"
              value={formData.neighbor}
              onChange={(e) => handleInputChange("neighbor", e.target.value)}
              placeholder="Enter neighbor name or details (optional)"
              className={errors.neighbor ? "border-red-500" : ""}
            />
            {errors.neighbor && <p className="text-sm text-red-600 mt-1">{errors.neighbor}</p>}
            <p className="text-sm text-gray-500 mt-1">Optional: Provide neighbor information for additional context</p>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Media & Website
          </CardTitle>
          <CardDescription>Connect your social profiles to build trust with guests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://yourwebsite.com"
              className={errors.website ? "border-red-500" : ""}
            />
            {errors.website && <p className="text-sm text-red-600 mt-1">{errors.website}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => handleInputChange("twitter", e.target.value)}
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => handleInputChange("linkedin", e.target.value)}
                placeholder="username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => handleInputChange("facebook", e.target.value)}
                placeholder="https://facebook.com/yourprofile"
                className={errors.facebook ? "border-red-500" : ""}
              />
              {errors.facebook && <p className="text-sm text-red-600 mt-1">{errors.facebook}</p>}
            </div>
            <div>
              <Label htmlFor="airbnb">Airbnb URL</Label>
              <Input
                id="airbnb"
                value={formData.airbnb}
                onChange={(e) => handleInputChange("airbnb", e.target.value)}
                placeholder="https://airbnb.com/users/show/yourprofile"
                className={errors.airbnb ? "border-red-500" : ""}
              />
              {errors.airbnb && <p className="text-sm text-red-600 mt-1">{errors.airbnb}</p>}
            </div>
            <div>
              <Label htmlFor="pinterest">Pinterest URL</Label>
              <Input
                id="pinterest"
                value={formData.pinterest}
                onChange={(e) => handleInputChange("pinterest", e.target.value)}
                placeholder="https://pinterest.com/yourprofile"
                className={errors.pinterest ? "border-red-500" : ""}
              />
              {errors.pinterest && <p className="text-sm text-red-600 mt-1">{errors.pinterest}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900">Select Your Payout Method</CardTitle>
          <CardDescription>Choose how you'd like to receive payments from your bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PayPal Option */}
            <div
              className={`relative border rounded-lg p-6 cursor-pointer transition-all hover:border-blue-500 ${
                formData.payoutMethod === "paypal" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => handleInputChange("payoutMethod", "paypal")}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Paypal</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.payoutMethod === "paypal" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {formData.payoutMethod === "paypal" && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                </div>
              </div>
            </div>

            {/* Skrill Option */}
            <div
              className={`relative border rounded-lg p-6 cursor-pointer transition-all hover:border-blue-500 ${
                formData.payoutMethod === "skrill" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => handleInputChange("payoutMethod", "skrill")}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Skrill</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.payoutMethod === "skrill" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {formData.payoutMethod === "skrill" && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                </div>
              </div>
            </div>

            {/* Wire Transfer Option */}
            <div
              className={`relative border rounded-lg p-6 cursor-pointer transition-all hover:border-blue-500 ${
                formData.payoutMethod === "wire" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => handleInputChange("payoutMethod", "wire")}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Wire Transfer</span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.payoutMethod === "wire" ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {formData.payoutMethod === "wire" && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                </div>
              </div>
            </div>
          </div>

          {formData.payoutMethod && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">
                {formData.payoutMethod === "paypal" && "PayPal Account Details"}
                {formData.payoutMethod === "skrill" && "Skrill Account Details"}
                {formData.payoutMethod === "wire" && "Wire Transfer Details"}
              </h4>

              {formData.payoutMethod === "paypal" && (
                <div>
                  <Label htmlFor="paypalEmail">PayPal Email Address</Label>
                  <Input id="paypalEmail" type="email" placeholder="your-paypal@email.com" className="mt-1" />
                </div>
              )}

              {formData.payoutMethod === "skrill" && (
                <div>
                  <Label htmlFor="skrillEmail">Skrill Email Address</Label>
                  <Input id="skrillEmail" type="email" placeholder="your-skrill@email.com" className="mt-1" />
                </div>
              )}

              {formData.payoutMethod === "wire" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" placeholder="Your Bank Name" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" placeholder="Account Number" className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input id="routingNumber" placeholder="Routing Number" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="swiftCode">SWIFT Code</Label>
                      <Input id="swiftCode" placeholder="SWIFT Code (for international)" className="mt-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
