"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useSpaces } from "@/lib/api/spaces"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Star, Eye, Grid3X3, List, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCurrency } from "@/contexts/currency-context"
import { getSpaceUrl } from "@/lib/utils/slug"

interface Space {
  id: string
  title: string
  description: string
  city: string
  state: string
  price_per_hour: number | null
  price_per_day: number | null
  rating_average: number
  rating_count: number
  images: string[]
  space_type: string
  amenities: string[]
}

export default function FavoritesPage() {
  const { formatPrice } = useCurrency()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [favorites, setFavorites] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const spacesApi = useSpaces()

  useEffect(() => {
    async function loadFavorites() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const userFavorites = await spacesApi.getUserFavorites()
        setFavorites(userFavorites as any)
      } catch (err) {
        console.error("[v0] Error loading favorites:", err)
        setError("Failed to load favorites")
      } finally {
        setIsLoading(false)
      }
    }

    loadFavorites()

    const channel = supabase
      .channel("favorites-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
        },
        () => {
          loadFavorites()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const removeFavorite = async (spaceId: string) => {
    try {
      await spacesApi.toggleFavorite(spaceId)
      setFavorites(favorites.filter((space) => space.id !== spaceId))
    } catch (error) {
      console.error("[v0] Error removing favorite:", error)
    }
  }

  const averageRating =
    favorites.length > 0
      ? (favorites.reduce((sum, space) => sum + (space.rating_average || 0), 0) / favorites.length).toFixed(1)
      : "0.0"

  const priceRange =
    favorites.length > 0
      ? (() => {
          const prices = favorites
            .map((space) => space.price_per_hour || space.price_per_day || 0)
            .filter((price) => price > 0)
          if (prices.length === 0) return "N/A"
          const min = Math.min(...prices)
          const max = Math.max(...prices)
          return `${formatPrice(min)}-${formatPrice(max)}`
        })()
      : "N/A"

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex flex-1">
          <DashboardSidebar activeTab="favorites" onTabChange={() => {}} />
          <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
        <DashboardSidebar activeTab="favorites" onTabChange={() => {}} />
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
                <p className="text-gray-600 mt-2">Spaces you've saved for future bookings</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Favorites</p>
                      <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Price Range</p>
                      <p className="text-2xl font-bold text-gray-900">{priceRange}</p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Favorites Grid/List */}
            {favorites.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-600 mb-6">Start exploring spaces and save your favorites for easy access.</p>
                  <Link href="/all-spaces">
                    <Button className="bg-blue-600 hover:bg-blue-700">Browse Spaces</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
                {favorites.map((space) => (
                  <Card
                    key={space.id}
                    className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === "list" ? "flex" : ""}`}
                  >
                    <div className={viewMode === "list" ? "w-48 flex-shrink-0" : ""}>
                      <div className="relative h-48 w-full">
                        <Image
                          src={space.images?.[0] || "/placeholder.svg"}
                          alt={space.title}
                          fill
                          className="object-cover"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                          onClick={() => removeFavorite(space.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {space.space_type}
                        </Badge>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{space.rating_average || 0}</span>
                          <span className="text-sm text-gray-500 ml-1">({space.rating_count || 0})</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{space.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{space.description}</p>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        {space.city}, {space.state}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          {space.price_per_hour && (
                            <span className="text-sm font-semibold text-blue-600">{formatPrice(space.price_per_hour, { showUnit: true, unit: "hr" })}</span>
                          )}
                          {space.price_per_day && (
                            <span className="text-lg font-bold text-blue-600 ml-2">{formatPrice(space.price_per_day, { showUnit: true, unit: "day" })}</span>
                          )}
                        </div>
                        <Link href={getSpaceUrl(space.title, space.id)}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            View Details
                          </Button>
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {space.amenities?.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
