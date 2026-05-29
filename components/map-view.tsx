"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, MapPin, Users, Star, Maximize2, Minimize2, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Space } from "@/app/find-space/page"
import type { google } from "google-maps"
import { getGoogleMapsScriptUrl } from "@/app/actions/maps"
import { useCurrency } from "@/contexts/currency-context"
import { getSpaceUrl } from "@/lib/utils/slug"

interface MapViewProps {
  spaces: Space[]
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

const getMarkerColor = (space: Space): string => {
  // Priority 1: Approval status (if available)
  if ((space as any).approval_status === "pending") return "#FFA500" // Orange for pending
  if ((space as any).approval_status === "rejected") return "#DC2626" // Red for rejected

  // Priority 2: Featured spaces
  if ((space as any).is_featured) return "#7C3AED" // Purple for featured

  // Priority 3: Instant book
  if ((space as any).instant_book) return "#2563EB" // Blue for instant book

  // Priority 4: Price range
  const price = space.price_per_day || space.price_per_hour || 0
  if (price < 100) return "#059669" // Green for budget-friendly
  if (price < 200) return "#0891B2" // Cyan for mid-range
  return "#DC2626" // Red for premium
}

// getMarkerLabel moved inside component to use currency context

export default function MapView({ spaces, isFullscreen, onToggleFullscreen }: MapViewProps) {
  const { formatPrice } = useCurrency()

  const getMarkerLabel = (space: Space): string => {
    const price = space.price_per_day || space.price_per_hour || 0
    return formatPrice(price)
  }

  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          createMap()
          return
        }

        // Get script URL from server action
        const scriptUrl = await getGoogleMapsScriptUrl()

        if (!scriptUrl) {
          setMapError("Google Maps is not available. Please contact support.")
          return
        }

        // Load Google Maps script
        const script = document.createElement("script")
        script.src = scriptUrl
        script.async = true
        script.defer = true

        script.onload = () => {
          console.log("[v0] Google Maps API loaded successfully")
          createMap()
        }

        script.onerror = () => {
          console.error("[v0] Failed to load Google Maps API")
          setMapError("Failed to load Google Maps. Please check your API key configuration.")
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("[v0] Error initializing map:", error)
        setMapError("An error occurred while loading the map.")
      }
    }

    initMap()

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []
    }
  }, [])

  const createMap = () => {
    if (!mapRef.current || !window.google) return

    try {
      // Calculate center based on spaces with coordinates
      const spacesWithCoords = spaces.filter((s) => s.latitude && s.longitude)

      let center = { lat: 39.8283, lng: -98.5795 } // Center of US

      if (spacesWithCoords.length > 0) {
        const avgLat = spacesWithCoords.reduce((sum, s) => sum + (s.latitude || 0), 0) / spacesWithCoords.length
        const avgLng = spacesWithCoords.reduce((sum, s) => sum + (s.longitude || 0), 0) / spacesWithCoords.length
        center = { lat: avgLat, lng: avgLng }
      }

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: spacesWithCoords.length > 0 ? 10 : 4,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      googleMapRef.current = map
      infoWindowRef.current = new window.google.maps.InfoWindow()

      setMapLoaded(true)
      console.log("[v0] Map created successfully")
    } catch (error) {
      console.error("[v0] Error creating map:", error)
      setMapError("Failed to create map instance.")
    }
  }

  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return

    console.log("[v0] Total spaces received:", spaces.length)
    console.log("[v0] Spaces with coordinates:", spaces.filter((s) => s.latitude && s.longitude).length)

    spaces.forEach((space, index) => {
      if (!space.latitude || !space.longitude) {
        console.log(`[v0] Space ${index + 1} "${space.title}" missing coordinates:`, {
          latitude: space.latitude,
          longitude: space.longitude,
          location: space.location,
        })
      }
    })

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Create new markers
    const bounds = new window.google.maps.LatLngBounds()
    let hasValidCoords = false

    spaces.forEach((space) => {
      if (!space.latitude || !space.longitude) return

      if (space.latitude < -90 || space.latitude > 90 || space.longitude < -180 || space.longitude > 180) {
        console.error(`[v0] Invalid coordinates for space "${space.title}":`, {
          latitude: space.latitude,
          longitude: space.longitude,
        })
        return
      }

      const position = { lat: space.latitude, lng: space.longitude }
      const color = getMarkerColor(space)
      const label = getMarkerLabel(space)

      console.log(`[v0] Creating marker for "${space.title}" at`, position, `with color ${color}`)

      // Create custom marker with color
      const marker = new window.google.maps.Marker({
        position,
        map: googleMapRef.current,
        title: space.title,
        label: {
          text: label,
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      })

      // Add click listener
      marker.addListener("click", () => {
        setSelectedSpace(space)

        // Create info window content
        const priceDisplay = formatPrice(space.price_per_day || space.price_per_hour || 0, { showUnit: true, unit: space.price_per_day ? "day" : "hour" })
        const content = `
          <div style="max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${space.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">${space.location}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Capacity: ${space.capacity} people</p>
            <p style="margin: 0; font-size: 18px; font-weight: 700;">${priceDisplay}</p>
          </div>
        `

        infoWindowRef.current?.setContent(content)
        infoWindowRef.current?.open(googleMapRef.current, marker)
      })

      markersRef.current.push(marker)
      bounds.extend(position)
      hasValidCoords = true
    })

    // Fit bounds if we have valid coordinates
    if (hasValidCoords && spaces.length > 1) {
      googleMapRef.current.fitBounds(bounds)
    }
  }, [spaces, mapLoaded])

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-white" : "h-96 lg:h-full"}`}>
      {/* Map Container */}
      <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
        {/* Loading State */}
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md p-6">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-sm text-gray-600 mb-4">{mapError}</p>
              <p className="text-xs text-gray-500">Please ensure your Google Maps API key is properly configured.</p>
            </div>
          </div>
        )}

        {/* Google Map */}
        <div ref={mapRef} className="w-full h-full" />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-white shadow-md hover:bg-gray-50"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
          <div className="text-sm font-semibold mb-2">Pin Colors</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#7C3AED]"></div>
              <span>Featured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#2563EB]"></div>
              <span>Instant Book</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#059669]"></div>
              <span>Budget (&lt;$100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#0891B2]"></div>
              <span>Mid-range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#DC2626]"></div>
              <span>Premium ($200+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#FFA500]"></div>
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* Selected Space Card */}
        {selectedSpace && (
          <div className="absolute top-4 left-4 w-80 z-20">
            <Card className="shadow-xl">
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    src={selectedSpace.image_url || "/placeholder.svg?height=160&width=320&text=Space"}
                    alt={selectedSpace.title}
                    width={320}
                    height={160}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => setSelectedSpace(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Badge className="absolute top-2 left-2 bg-white text-gray-900">{selectedSpace.space_type}</Badge>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{selectedSpace.title}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{selectedSpace.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedSpace.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selectedSpace.capacity} people
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">{selectedSpace.description}</p>

                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <span className="text-xl font-bold">
                          {formatPrice(selectedSpace.price_per_day || selectedSpace.price_per_hour || 0, { showUnit: true, unit: selectedSpace.price_per_day ? "day" : "hour" })}
                        </span>
                      </div>
                      <Link href={getSpaceUrl(selectedSpace.title, selectedSpace.id)}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
