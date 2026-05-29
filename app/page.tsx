import SiteHeader from "@/components/site-header"
import HeroSection from "@/components/hero-section"
import MainSearch from "@/components/main-search"
import SpaceCategories from "@/components/space-categories"
import FeaturedSpaces from "@/components/featured-spaces"
import SpaceInspiration from "@/components/space-inspiration"
import SiteFooter from "@/components/site-footer"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "Find Your Perfect Space",
  description:
    "Discover flexible workspace solutions for offices, conference rooms, event spaces, and storage. Book instantly with no lease or upfront costs. Browse thousands of spaces available now.",
  keywords: [
    "find workspace",
    "book office space",
    "rent conference room",
    "event venue",
    "flexible workspace",
    "coworking space near me",
  ],
  path: "/",
})

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <HeroSection />
      <main className="flex-1 bg-gradient-to-br from-green-50/50 to-blue-50/50">
        <MainSearch />
        <SpaceCategories />
        <FeaturedSpaces />
        <SpaceInspiration />
      </main>
      <SiteFooter />
    </div>
  )
}
