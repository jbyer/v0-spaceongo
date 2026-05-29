"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import SearchFilters from "@/components/search-filters"
import SearchResults from "@/components/search-results"
import MapView from "@/components/map-view"
import { Button } from "@/components/ui/button"
import { List, Map } from "lucide-react"
import type { FilterState, Space } from "@/types/find-space"

export default function FindSpaceClientPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState("relevance")

  const [filters, setFilters] = useState<FilterState>({
    location: "",
    spaceType: "",
    capacity: 1,
    priceRange: [0, 1000],
    amenities: [],
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const ITEMS_PER_PAGE = 12

  const fetchSpaces = async (pageNum: number, append = false) => {
    try {
      setLoading(true)

      let query = supabase.from("spaces").select("*", { count: "exact" }).eq("is_active", true) // Only show active spaces

      // Apply filters
      if (filters.spaceType) {
        query = query.ilike("space_type", filters.spaceType)
      }

      if (filters.location) {
        query = query.or(
          `city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,location.ilike.%${filters.location}%`,
        )
      }

      if (filters.capacity > 1) {
        query = query.gte("capacity", filters.capacity)
      }

      // Price range filter (check both hourly and daily rates)
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
        query = query.or(`price_per_day.gte.${filters.priceRange[0]},price_per_day.lte.${filters.priceRange[1]}`)
      }

      if (filters.amenities.length > 0) {
        // Use the contains operator @> to check if the space's amenities array contains all selected amenities
        // For case-insensitive matching, we'll fetch all spaces and filter client-side
        console.log("[v0] Applying amenities filter:", filters.amenities)
      }

      // Apply sorting
      switch (sortBy) {
        case "price-low":
          query = query.order("price_per_day", { ascending: true, nullsFirst: false })
          break
        case "price-high":
          query = query.order("price_per_day", { ascending: false, nullsFirst: false })
          break
        case "rating":
          query = query.order("rating", { ascending: false, nullsFirst: false })
          break
        case "capacity":
          query = query.order("capacity", { ascending: false })
          break
        default:
          query = query.order("created_at", { ascending: false })
      }

      // Pagination
      const from = pageNum * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error("[v0] Error fetching spaces:", error)
        return
      }

      let formattedSpaces: Space[] = (data || []).map((space) => ({
        id: space.id,
        title: space.title,
        space_type: space.space_type,
        location: `${space.city}, ${space.state}`,
        city: space.city,
        state: space.state,
        capacity: space.capacity,
        price_per_hour: space.price_per_hour,
        price_per_day: space.price_per_day,
        rating: space.rating_average || 0,
        image_url: space.images?.[0] || null,
        description: space.description,
        amenities: space.amenities || [],
        is_active: space.is_active,
        latitude: space.latitude,
        longitude: space.longitude,
      }))

      if (filters.amenities.length > 0) {
        formattedSpaces = formattedSpaces.filter((space) => {
          // Check if space has all selected amenities (case-insensitive)
          const spaceAmenities = (space.amenities || []).map((a) => a.toLowerCase())
          return filters.amenities.every((selectedAmenity) =>
            spaceAmenities.some((spaceAmenity) => spaceAmenity.includes(selectedAmenity.toLowerCase())),
          )
        })
        console.log("[v0] Filtered spaces by amenities. Count:", formattedSpaces.length)
      }

      if (append) {
        setSpaces((prev) => [...prev, ...formattedSpaces])
      } else {
        setSpaces(formattedSpaces)
      }

      if (filters.amenities.length > 0) {
        // When filtering client-side, we can't rely on the count from the server
        setHasMore(formattedSpaces.length >= ITEMS_PER_PAGE)
      } else {
        setHasMore(count ? (pageNum + 1) * ITEMS_PER_PAGE < count : false)
      }
    } catch (error) {
      console.error("[v0] Error in fetchSpaces:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
    fetchSpaces(0, false)
  }, [filters, sortBy])

  useEffect(() => {
    const channel = supabase
      .channel("spaces-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        () => {
          // Refetch data when changes occur
          fetchSpaces(0, false)
          setPage(0)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filters, sortBy])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchSpaces(nextPage, true)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Space</h1>
                <p className="text-gray-600">Discover spaces that match your needs</p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-white rounded-lg border p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  Map
                </Button>
              </div>
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="lg:w-80 flex-shrink-0">
                <SearchFilters filters={filters} setFilters={setFilters} />
              </aside>
              <div className="flex-1">
                <SearchResults
                  spaces={spaces}
                  loading={loading}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  hasMore={hasMore}
                  onLoadMore={handleLoadMore}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
              <aside className="lg:w-80 flex-shrink-0">
                <SearchFilters filters={filters} setFilters={setFilters} />
              </aside>
              <div className="flex-1">
                <MapView
                  spaces={spaces}
                  isFullscreen={isMapFullscreen}
                  onToggleFullscreen={() => setIsMapFullscreen(!isMapFullscreen)}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
