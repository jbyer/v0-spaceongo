import { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { getSpaceUrl } from "@/lib/utils/slug"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spacesongo.com"

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"

interface SitemapEntry {
  url: string
  lastModified: Date
  changeFrequency: ChangeFrequency
  priority: number
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Static pages with their priorities and change frequencies
  const staticPages: SitemapEntry[] = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/all-spaces`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/find-space`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/list-space`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/auth/sign-up`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  // Fetch active spaces for dynamic URLs
  let spacePages: SitemapEntry[] = []
  try {
    const { data: spaces } = await supabase
      .from("spaces")
      .select("id, title, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })

    if (spaces) {
      spacePages = spaces.map((space) => ({
        url: `${BASE_URL}${getSpaceUrl(space.title, space.id)}`,
        lastModified: new Date(space.updated_at),
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error("Error fetching spaces for sitemap:", error)
  }

  // Fetch published blog posts for dynamic URLs
  let blogPages: SitemapEntry[] = []
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })

    if (posts) {
      blogPages = posts.map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at || new Date()),
        changeFrequency: "monthly" as ChangeFrequency,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error)
  }

  // Combine all pages
  return [...staticPages, ...spacePages, ...blogPages]
}
