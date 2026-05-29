"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Users, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useCurrency } from "@/contexts/currency-context"
import { getSpaceUrl } from "@/lib/utils/slug"

type FeaturedSpace = {
  id: string
  title: string
  city: string
  state: string
  space_type: string
  capacity: number | null
  price_per_day: number | null
  rating_average: number | null
  rating_count: number | null
  images: string[] | null
  short_description: string | null
  is_featured: boolean
}

export default function FeaturedSpaces() {
  const [featuredSpaces, setFeaturedSpaces] = useState<FeaturedSpace[]>([])
  const [displayCount, setDisplayCount] = useState(6)
  const [isVisible, setIsVisible] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Fetch settings from server-side API that uses service role to bypass RLS
        // Add cache-busting timestamp to ensure fresh data
        const response = await fetch(`/api/settings/public?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }
        
        const { settings } = await response.json()
        
        if (settings.featured_spaces_count) {
          setDisplayCount(Number.parseInt(settings.featured_spaces_count))
        } else {
          setDisplayCount(6)
        }

        if (settings.featured_spaces_visible !== undefined) {
          const visible = settings.featured_spaces_visible === "true"
          setIsVisible(visible)
        } else {
          // If setting doesn't exist, default to true
          setIsVisible(true)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        setDisplayCount(6)
        setIsVisible(true)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    const fetchFeaturedSpaces = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("spaces")
          .select(`
            *,
            profiles:host_id (
              id,
              first_name,
              last_name,
              display_name,
              profile_image_url
            ),
            space_categories (
              name,
              slug
            )
          `)
          .eq("is_featured", true)
          .eq("is_active", true)
          .limit(12)
          .order("created_at", { ascending: false })

        if (error) throw error
        setFeaturedSpaces(data as FeaturedSpace[])
      } catch (error) {
        console.error("Error fetching featured spaces:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedSpaces()
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const settingsChannel = supabase
      .channel("admin_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_settings",
          filter: "setting_key=eq.featured_spaces_count",
        },
        (payload) => {
          if (payload.new && "setting_value" in payload.new) {
            const newCount = Number.parseInt(payload.new.setting_value as string)
            console.log("[v0] Display count changed via real-time:", newCount)
            setDisplayCount(newCount)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_settings",
          filter: "setting_key=eq.featured_spaces_visible",
        },
        (payload) => {
          if (payload.new && "setting_value" in payload.new) {
            const newVisibility = payload.new.setting_value === "true"
            console.log("[v0] Visibility changed via real-time:", newVisibility)
            setIsVisible(newVisibility)
          }
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
        async () => {
          try {
            const { data, error } = await supabase
              .from("spaces")
              .select(`
                *,
                profiles:host_id (
                  id,
                  first_name,
                  last_name,
                  display_name,
                  profile_image_url
                ),
                space_categories (
                  name,
                  slug
                )
              `)
              .eq("is_featured", true)
              .eq("is_active", true)
              .limit(12)
              .order("created_at", { ascending: false })

            if (error) throw error
            setFeaturedSpaces(data as FeaturedSpace[])
          } catch (error) {
            console.error("Error refetching featured spaces:", error)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(settingsChannel)
      supabase.removeChannel(spacesChannel)
    }
  }, [])

  useEffect(() => {
    const handleCountChange = (event: CustomEvent) => {
      console.log("[v0] Display count changed via custom event:", event.detail.count)
      setDisplayCount(event.detail.count)
    }

    const handleVisibilityChange = (event: CustomEvent) => {
      console.log("[v0] Visibility changed via custom event:", event.detail.visible)
      setIsVisible(event.detail.visible)
    }

    window.addEventListener("featuredSpacesCountChanged", handleCountChange as EventListener)
    window.addEventListener("featuredSpacesVisibilityChanged", handleVisibilityChange as EventListener)

    return () => {
      window.removeEventListener("featuredSpacesCountChanged", handleCountChange as EventListener)
      window.removeEventListener("featuredSpacesVisibilityChanged", handleVisibilityChange as EventListener)
    }
  }, [])

  const handleViewSpace = (spaceId: string) => {
    window.location.href = getSpaceUrl(space.title, spaceId)
  }

  const spacesToDisplay = featuredSpaces.slice(0, displayCount)

  if (isVisible === false) {
    return null
  }

  if (isVisible === null) {
    return (
      <section className="featured py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="featured py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Spaces</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium spaces, chosen for their exceptional quality and unique
            features.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : featuredSpaces.length === 0 ? (
          <div className="text-center mb-12">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No featured spaces available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              displayCount === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : displayCount === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                  : displayCount === 3
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : displayCount <= 4
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                      : displayCount <= 6
                        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        : displayCount <= 8
                          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}
          >
            {spacesToDisplay.map((space) => (
              <Card key={space.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <Image
                    src={space.images?.[0] || "/placeholder.svg?height=250&width=400"}
                    alt={space.title}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-blue-600 hover:bg-blue-700">Featured</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-800">
                      {space.space_type}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">{space.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {space.city}, {space.state}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-gray-600">Up to {space.capacity || "N/A"}</span>
                      </div>
                      {space.rating_average && space.rating_count ? (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                          <span className="font-medium">{space.rating_average.toFixed(1)}</span>
                          <span className="text-gray-500 ml-1">({space.rating_count})</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {space.short_description || "Premium space available for booking"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-blue-600">
                      {formatPrice(space.price_per_day)}
                      <span className="text-sm font-normal text-gray-500">/day</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleViewSpace(space.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/all-spaces">
            <Button variant="outline" size="lg" className="bg-blue-600 text-black hover:bg-blue-700 border-blue-600">
              View All Spaces
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
