"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ExternalLink, Navigation, Store, AlertCircle, Lock } from 'lucide-react'
import { getGoogleMapsScriptUrl } from "@/app/actions/maps"

// Declare global google object for TypeScript
declare global {
  interface Window {
    google: any
    gm_authFailure: () => void
  }
}

interface GoogleMapsLocationProps {
  address: string
  spaceName: string
  latitude?: number
  longitude?: number
  showExactLocation?: boolean
}

export default function GoogleMapsLocation({
  address,
  spaceName,
  latitude,
  longitude,
  showExactLocation = false,
}: GoogleMapsLocationProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [showPOI, setShowPOI] = useState(false)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    getGoogleMapsScriptUrl().then((scriptUrl) => {
      if (!scriptUrl) {
        console.error("[v0] Google Maps API key not configured - GOOGLE_MAPS_API_KEY environment variable is missing")
        setHasError(true)
        setErrorMessage("Google Maps API is not configured. Please add GOOGLE_MAPS_API_KEY to your environment variables.")
        return
      }

      // Load Google Maps script if not already loaded
      if (!window.google) {
        const script = document.createElement("script")
        script.src = scriptUrl
        script.async = true
        script.onload = () => {
          console.log("[v0] Google Maps script loaded")
          // Wait for window.google.maps to be available (it may not be immediately ready)
          const checkMapsReady = setInterval(() => {
            if (window.google && window.google.maps && window.google.maps.LatLng) {
              clearInterval(checkMapsReady)
              console.log("[v0] Google Maps API is ready")
              setIsLoaded(true)
            }
          }, 50)
          
          // Safety timeout - clear interval after 5 seconds
          setTimeout(() => clearInterval(checkMapsReady), 5000)
        }
        script.onerror = () => {
          console.error("[v0] Failed to load Google Maps script from URL:", scriptUrl)
          setHasError(true)
          setErrorMessage("Failed to load Google Maps. Check that your API key is valid and the API is enabled in Google Cloud Console.")
        }

        window.gm_authFailure = () => {
          console.error("[v0] Google Maps authentication failed - likely domain restriction or invalid API key")
          setHasError(true)
          setErrorMessage(
            "Google Maps API authentication failed. This could be due to: (1) Invalid API key, (2) API not enabled in Google Cloud, or (3) Domain restriction. Please check your Google Cloud Console settings.",
          )
        }

        document.head.appendChild(script)
      } else {
        setIsLoaded(true)
      }
    }).catch((error) => {
      console.error("[v0] Error getting Google Maps script URL:", error)
      setHasError(true)
      setErrorMessage("Failed to initialize Google Maps")
    })
  }, [])

  useEffect(() => {
    if (isLoaded && window.google && !hasError) {
      initializeMap()
    }
  }, [isLoaded, address, latitude, longitude, hasError])

  const initializeMap = async () => {
    try {
      // Double-check that Google Maps API is available
      if (!window.google || !window.google.maps || !window.google.maps.LatLng) {
        console.error("[v0] Google Maps API not fully loaded")
        setHasError(true)
        return
      }

      let location: any

      // Use provided coordinates if available, otherwise geocode the address
      if (latitude && longitude) {
        location = new window.google.maps.LatLng(latitude, longitude)
        createMap(location)
      } else {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            location = results[0].geometry.location
            createMap(location)
          } else {
            console.log("[v0] Geocoding failed:", status)
            setHasError(true)
          }
        })
      }
    } catch (error) {
      console.error("[v0] Error initializing map:", error)
      setHasError(true)
    }
  }

  const createMap = (location: any) => {
    const mapElement = document.getElementById("google-map")
    if (!mapElement) return

    let mapCenter = location
    let zoomLevel = 15

    if (!showExactLocation && latitude && longitude) {
      // Add random offset to approximate location (±0.01 degrees ≈ ±1km)
      const offsetLat = (Math.random() - 0.5) * 0.01
      const offsetLng = (Math.random() - 0.5) * 0.01
      mapCenter = new window.google.maps.LatLng(latitude + offsetLat, longitude + offsetLng)
      zoomLevel = 13 // Wider zoom for approximate view
    }

    // Create map with custom styling
    const map = new window.google.maps.Map(mapElement, {
      zoom: zoomLevel,
      center: mapCenter,
      mapTypeControl: true,
      streetViewControl: showExactLocation, // Only show street view for exact location
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi.business",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
    })

    mapRef.current = map

    if (showExactLocation) {
      // Exact location: precise marker
      const marker = new window.google.maps.Marker({
        position: location,
        map,
        title: spaceName,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${spaceName}</h3>
            <p style="margin: 0; color: #666; font-size: 12px;">${address}</p>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(map, marker)
      })

      markersRef.current = [marker]
    } else {
      // Approximate location: circular area
      const circle = new window.google.maps.Circle({
        strokeColor: "#f97316",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#f97316",
        fillOpacity: 0.2,
        map,
        center: mapCenter,
        radius: 500, // 500 meter radius
      })

      // Add a center marker for the approximate area
      const marker = new window.google.maps.Marker({
        position: mapCenter,
        map,
        title: "Approximate Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#f97316",
          fillOpacity: 0.6,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      markersRef.current = [marker]
    }
  }

  const togglePOI = () => {
    if (!mapRef.current || !window.google) return

    const newShowPOI = !showPOI
    setShowPOI(newShowPOI)

    if (newShowPOI) {
      // Show nearby places of interest
      const service = new window.google.maps.places.PlacesService(mapRef.current)
      const center = mapRef.current.getCenter()

      if (!center) return

      const request = {
        location: center,
        radius: 500, // 500 meters
        type: ["restaurant", "cafe", "store", "parking"],
      }

      service.nearbySearch(request, (results: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          // Clear existing POI markers (keep the space marker)
          markersRef.current.slice(1).forEach((marker) => marker.setMap(null))
          markersRef.current = [markersRef.current[0]]

          // Add markers for nearby places (limit to 10)
          results.slice(0, 10).forEach((place: any) => {
            if (!place.geometry?.location) return

            const marker = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapRef.current,
              title: place.name,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: "#3b82f6",
                fillOpacity: 0.8,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
            })

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; max-width: 200px;">
                  <h4 style="margin: 0 0 4px 0; font-weight: 600; font-size: 13px;">${place.name}</h4>
                  <p style="margin: 0; color: #666; font-size: 11px;">${place.vicinity}</p>
                  ${place.rating ? `<p style="margin: 4px 0 0 0; color: #f59e0b; font-size: 11px;">⭐ ${place.rating}</p>` : ""}
                </div>
              `,
            })

            marker.addListener("click", () => {
              infoWindow.open(mapRef.current, marker)
            })

            markersRef.current.push(marker)
          })
        }
      })
    } else {
      // Hide POI markers
      markersRef.current.slice(1).forEach((marker) => marker.setMap(null))
      markersRef.current = [markersRef.current[0]]
    }
  }

  const openInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank")
  }

  const getDirections = () => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank")
  }

  const renderFallbackMap = () => (
    <div className="w-full h-96 rounded-lg bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6">
      <AlertCircle className="w-12 h-12 text-orange-500 mb-3" />
      <p className="text-gray-700 font-medium text-center mb-2">Interactive Map Unavailable</p>
      <p className="text-sm text-gray-600 text-center mb-2 max-w-md">
        {errorMessage || "The interactive map requires Google Maps API configuration."}
      </p>
      {errorMessage.includes("domain restriction") && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4 max-w-md">
          <div className="flex items-start gap-2 mb-2">
            <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-900">
              Google Maps Domain Not Authorized
            </p>
          </div>
          <p className="text-xs text-amber-800 mb-3">
            This preview domain needs to be added to your Google Maps API key's allowed referrers:
          </p>
          <div className="bg-white rounded border border-amber-200 p-2 mb-3">
            <code className="text-xs text-gray-800 break-all">
              *.vusercontent.net/*
            </code>
          </div>
          <details className="text-xs text-amber-700">
            <summary className="cursor-pointer font-medium mb-2">Show setup instructions</summary>
            <ol className="space-y-1.5 list-decimal list-inside ml-1 mt-2">
              <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Go to APIs & Services → Credentials</li>
              <li>Click on your Maps API key</li>
              <li>Under "Application restrictions", select "HTTP referrers"</li>
              <li>Add the referrer pattern above</li>
              <li>Save changes (may take 1-2 minutes to propagate)</li>
            </ol>
          </details>
        </div>
      )}
      <p className="text-sm text-gray-600 text-center mb-4">You can still view the location on Google Maps.</p>
      <div className="flex gap-2">
        <Button onClick={openInGoogleMaps} variant="default" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Google Maps
        </Button>
        <Button onClick={getDirections} variant="outline" size="sm">
          <Navigation className="w-4 h-4 mr-2" />
          Get Directions
        </Button>
      </div>
    </div>
  )

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Location
            {!showExactLocation && <Lock className="w-4 h-4 text-gray-400" />}
          </h2>
          <div className="flex gap-2">
            {showExactLocation && (
              <Button onClick={getDirections} variant="outline" size="sm">
                <Navigation className="w-4 h-4 mr-2" />
                Directions
              </Button>
            )}
            <Button onClick={openInGoogleMaps} variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          </div>
        </div>

        <div className="mb-4">
          {showExactLocation ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <strong>Exact Location:</strong> You have access to the precise address
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <strong>Approximate Location:</strong> Exact address will be revealed after booking confirmation
              </p>
            </div>
          )}
          <p className="text-gray-700 font-medium">
            {showExactLocation
              ? address
              : `${address.split(",")[address.split(",").length - 2]}, ${address.split(",")[address.split(",").length - 1]}`}
          </p>
        </div>

        <div className="relative">
          {hasError ? (
            renderFallbackMap()
          ) : (
            <>
              <div
                id="google-map"
                className="w-full h-96 rounded-lg bg-gray-100 flex items-center justify-center"
                role="application"
                aria-label={`Map showing location of ${spaceName}`}
              >
                {!isLoaded ? <div className="text-gray-500">Loading map...</div> : null}
              </div>

              {isLoaded && !hasError && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={togglePOI} variant={showPOI ? "default" : "outline"} size="sm">
                    {showPOI ? (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Hide Nearby Places
                      </>
                    ) : (
                      <>
                        <Store className="w-4 h-4 mr-2" />
                        Show Nearby Places
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>📍 Exact location will be provided after booking confirmation</p>
        </div>
      </CardContent>
    </Card>
  )
}
