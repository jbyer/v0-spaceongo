"use server"

export async function getGoogleMapsScriptUrl() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn("[v0] GOOGLE_MAPS_API_KEY environment variable is not set")
    return null
  }

  // Return the complete script URL with the API key embedded
  // Use callback=initMap for better library initialization in production
  // Remove loading=async to ensure proper script loading order
  return `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
}
