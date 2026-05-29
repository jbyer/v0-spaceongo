import type { Metadata } from "next"

export const siteConfig = {
  name: "SpaceOnGo",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://spaceongo.com",
  ogImage: "/images/spaceongo-og.png",
  description:
    "Find and book flexible workspace solutions - offices, conference rooms, event spaces, and storage. No lease, no hassle.",
  keywords: [
    "workspace",
    "office space",
    "coworking",
    "event space",
    "conference room",
    "meeting space",
    "storage space",
    "flexible workspace",
  ],
}

export function createMetadata({
  title,
  description,
  keywords,
  image,
  path = "",
  noIndex = false,
}: {
  title: string
  description: string
  keywords?: string[]
  image?: string
  path?: string
  noIndex?: boolean
}): Metadata {
  const url = `${siteConfig.url}${path}`
  const ogImage = image || siteConfig.ogImage

  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords: keywords || siteConfig.keywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title: `${title} | ${siteConfig.name}`,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [ogImage],
      creator: "@spaceongo",
    },
    alternates: {
      canonical: url,
    },
  }
}
