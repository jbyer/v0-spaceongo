import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createMetadata } from "@/lib/seo/metadata"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import SpaceDetailPageClient from "./SpaceDetailPageClient"
import { extractSpaceIdFromSlug, getSpaceUrl } from "@/lib/utils/slug"
import { redirect } from "next/navigation"

type SpaceData = {
  id: string
  title: string
  city: string
  state: string
  address: string | null
  space_type: string
  capacity: number | null
  price_per_day: number | null
  price_per_hour: number | null
  rating_average: number | null
  rating_count: number | null
  images: string[] | null
  amenities: string[] | null
  short_description: string | null
  long_description: string | null
  is_featured: boolean
  instant_book: boolean
  host_id: string
  created_at: string
  latitude: number | null
  longitude: number | null
}

async function getSpaceBySlug(slug: string) {
  const supabase = createSupabaseServerClient()
  const parsed = extractSpaceIdFromSlug(slug)
  
  if (!parsed) {
    return { space: null, error: "Invalid URL format" }
  }

  if (parsed.type === 'uuid') {
    // Direct UUID lookup (legacy URLs)
    const { data, error } = await supabase
      .from("spaces")
      .select("*, latitude, longitude")
      .eq("id", parsed.value)
      .eq("is_active", true)
      .single()
    return { space: data, error: error?.message || null }
  }

  // Short ID lookup - find space where ID ends with the short ID
  // Fetch active spaces and filter in JS since Supabase doesn't support LIKE on UUID columns
  const { data: spaces, error } = await supabase
    .from("spaces")
    .select("*, latitude, longitude")
    .eq("is_active", true)

  if (error) {
    return { space: null, error: error.message }
  }

  // Find the space where the ID (without dashes) ends with the short ID
  const shortId = parsed.value.toLowerCase()
  const matchedSpace = spaces?.find(space => 
    space.id.replace(/-/g, '').toLowerCase().endsWith(shortId)
  )

  return { space: matchedSpace || null, error: matchedSpace ? null : "Space not found" }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { space } = await getSpaceBySlug(slug)

  if (!space) {
    return createMetadata({
      title: "Space Not Found",
      description: "The space you're looking for is no longer available.",
      path: `/space/${slug}`,
      noIndex: true,
    })
  }

  const priceText = space.price_per_day ? `$${space.price_per_day}/day` : "Contact for pricing"
  const locationText = `${space.city}, ${space.state}`
  const canonicalUrl = getSpaceUrl(space.title, space.id)

  return createMetadata({
    title: `${space.title} - ${space.space_type} in ${locationText}`,
    description:
      space.short_description ||
      `Book ${space.title}, a ${space.space_type} in ${locationText}. ${priceText}. View photos, amenities, and availability on SpaceOnGo.`,
    keywords: [space.space_type, space.city, space.state, "workspace rental", ...(space.amenities || []).slice(0, 5)],
    image: space.images?.[0] || undefined,
    path: canonicalUrl,
  })
}

export default async function SpacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { space, error } = await getSpaceBySlug(slug)

  // If space found and URL is legacy UUID, redirect to SEO-friendly URL
  if (space) {
    const canonicalSlug = getSpaceUrl(space.title, space.id).replace('/space/', '')
    if (slug !== canonicalSlug && extractSpaceIdFromSlug(slug)?.type === 'uuid') {
      redirect(getSpaceUrl(space.title, space.id))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-6">
        <SpaceDetailPageClient spaceData={space} initialError={error} spaceId={space?.id || slug} />
      </main>
      <SiteFooter />
    </div>
  )
}
