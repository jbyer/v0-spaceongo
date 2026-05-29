"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AllSpacesFilters } from "@/components/all-spaces-filters"
import { AllSpacesGrid } from "@/components/all-spaces-grid"
import { Button } from "@/components/ui/button"
import { Grid, List } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Space = {
  id: string
  title: string
  city: string
  state: string
  space_type: string
  capacity: number | null
  price_per_day: number | null
  price_per_hour: number | null
  rating_average: number | null
  rating_count: number | null
  images: string[] | null
  short_description: string | null
  is_featured: boolean
  amenities: string[] | null
  instant_book: boolean
  host_id: string
}

export default function AllSpacesClient() {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("relevance")
  const [displayCount, setDisplayCount] = useState(12)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    type: [] as string[],
    location: "",
    minPrice: 0,
    maxPrice: 1000,
    capacity: 0,
    amenities: [] as string[],
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })

  const pageHeading = useMemo(() => {
    const typeParam = searchParams.get("type")
    if (typeParam === "Home") {
      return `All Homes`
    } else if (typeParam === "Event Space") {
      return `All Event Spaces`
    } else if (typeParam) {
      return `All ${typeParam} Spaces`
    }
    return "All Spaces"
  }, [searchParams])

  useEffect(() => {
    const typeParam = searchParams.get("type")
    if (typeParam && !filters.type.includes(typeParam)) {
      setFilters((prev) => ({
        ...prev,
        type: [typeParam],
      }))
    }
  }, [searchParams])

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("spaces")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching spaces:", error)
          throw error
        }

        console.log("[v0] Fetched spaces from database:", data?.length || 0)
        setSpaces(data || [])
      } catch (error) {
        console.error("[v0] Error in fetchSpaces:", error)
        setSpaces([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpaces()
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("spaces_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spaces",
        },
        async () => {
          console.log("[v0] Spaces table changed, refetching...")
          try {
            const { data, error } = await supabase
              .from("spaces")
              .select("*")
              .eq("is_active", true)
              .order("created_at", { ascending: false })

            if (error) throw error
            setSpaces(data || [])
          } catch (error) {
            console.error("[v0] Error refetching spaces:", error)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const loadDisplayCount = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("admin_settings")
          .select("*")
          .eq("setting_key", "all_spaces_per_page")
          .maybeSingle()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setDisplayCount(Number.parseInt(data.setting_value))
        }
      } catch (error) {
        console.error("[v0] Error loading display count:", error)
      }
    }

    loadDisplayCount()

    const handleSettingsChange = (event: CustomEvent) => {
      const newCount = event.detail.displayCount
      if (newCount !== displayCount) {
        setDisplayCount(newCount)
      }
    }

    window.addEventListener("allSpacesSettingsChanged", handleSettingsChange as EventListener)

    return () => {
      window.removeEventListener("allSpacesSettingsChanged", handleSettingsChange as EventListener)
    }
  }, [])

  const filteredAndSortedSpaces = useMemo(() => {
    console.log("[v0] Filtering spaces with filters:", filters)

    const filtered = spaces.filter((space) => {
      const matchesSearch =
        !filters.search ||
        space.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        `${space.city}, ${space.state}`.toLowerCase().includes(filters.search.toLowerCase())

      const selectedTypes = Array.isArray(filters.type) ? filters.type : filters.type ? [filters.type] : []
      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.some((type) => space.space_type.toLowerCase() === type.toLowerCase())

      const matchesLocation =
        !filters.location ||
        space.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        space.state.toLowerCase().includes(filters.location.toLowerCase())
      const matchesPrice =
        (space.price_per_day || 0) >= filters.minPrice && (space.price_per_day || 0) <= filters.maxPrice
      const matchesCapacity = !filters.capacity || (space.capacity || 0) >= filters.capacity

      const matchesAmenities =
        filters.amenities.length === 0 ||
        filters.amenities.every((amenity) =>
          space.amenities?.some((spaceAmenity) => spaceAmenity.toLowerCase() === amenity.toLowerCase()),
        )

      const matchesDates = true

      return (
        matchesSearch &&
        matchesType &&
        matchesLocation &&
        matchesPrice &&
        matchesCapacity &&
        matchesAmenities &&
        matchesDates
      )
    })

    console.log("[v0] Filtered spaces count:", filtered.length)

    switch (sortBy) {
      case "price-low":
        return filtered.sort((a, b) => {
          const priceDiff = (a.price_per_day || 0) - (b.price_per_day || 0)
          if (priceDiff !== 0) return priceDiff
          return (b.rating_average || 0) - (a.rating_average || 0)
        })
      case "price-high":
        return filtered.sort((a, b) => {
          const priceDiff = (b.price_per_day || 0) - (a.price_per_day || 0)
          if (priceDiff !== 0) return priceDiff
          return (b.rating_average || 0) - (a.rating_average || 0)
        })
      case "rating":
        return filtered.sort((a, b) => {
          const ratingDiff = (b.rating_average || 0) - (a.rating_average || 0)
          if (ratingDiff !== 0) return ratingDiff
          return (b.rating_count || 0) - (a.rating_count || 0)
        })
      case "capacity":
        return filtered.sort((a, b) => {
          const capacityDiff = (b.capacity || 0) - (a.capacity || 0)
          if (capacityDiff !== 0) return capacityDiff
          return (b.rating_average || 0) - (a.rating_average || 0)
        })
      case "newest":
        return filtered
      default:
        return filtered.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1
          if (!a.is_featured && b.is_featured) return 1
          const ratingDiff = (b.rating_average || 0) - (a.rating_average || 0)
          if (ratingDiff !== 0) return ratingDiff
          return (b.rating_count || 0) - (a.rating_count || 0)
        })
    }
  }, [spaces, filters, sortBy])

  const displayedSpaces = useMemo(() => {
    return filteredAndSortedSpaces.slice(0, displayCount).map((space) => ({
      id: space.id,
      name: space.title,
      location: `${space.city}, ${space.state}`,
      type: space.space_type,
      capacity: space.capacity || 0,
      dailyRate: space.price_per_day || 0,
      hourlyRate: space.price_per_hour || null,
      rating: space.rating_average || 0,
      reviewCount: space.rating_count || 0,
      image: space.images?.[0] || "/placeholder.svg?height=250&width=400",
      description: space.short_description || "Premium space available for booking",
      amenities: space.amenities || [],
      featured: space.is_featured,
      verified: true,
      superhost: false,
      instantBooking: space.instant_book,
    }))
  }, [filteredAndSortedSpaces, displayCount])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">{pageHeading}</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Discover amazing spaces for your next project, event, or meeting
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="text-sm text-muted-foreground">
                  Showing {displayedSpaces.length} of {filteredAndSortedSpaces.length} spaces
                  {filteredAndSortedSpaces.length > displayCount && (
                    <span className="text-blue-600 ml-1">(limited by admin settings)</span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="relevance">Sort by Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="capacity">Largest Capacity</option>
                    <option value="newest">Newest Listed</option>
                  </select>

                  <div className="flex border border-border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-80 flex-shrink-0">
                  <AllSpacesFilters filters={filters} onFiltersChange={setFilters} />
                </div>

                <div className="flex-1">
                  <AllSpacesGrid spaces={displayedSpaces} viewMode={viewMode} />

                  {filteredAndSortedSpaces.length > displayCount && (
                    <div className="mt-8 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Showing {displayCount} of {filteredAndSortedSpaces.length} spaces
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setDisplayCount((prev) => Math.min(prev + 12, filteredAndSortedSpaces.length))}
                      >
                        Load More Spaces
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
