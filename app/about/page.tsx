import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import AboutHero from "@/components/about-hero"
import MissionSection from "@/components/mission-section"
import TeamSection from "@/components/team-section"
import ServicesSection from "@/components/services-section"
import StatsSection from "@/components/stats-section"
import CallToAction from "@/components/call-to-action"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "About SpaceOnGo | Flexible Office, Meeting, and Storage Solutions",
  description:
    "Learn about SpaceOnGo's mission to connect space providers with individuals and businesses seeking flexible workspace solutions. Trusted by thousands of users worldwide.",
  keywords: ["about spaceongo", "workspace platform", "space rental marketplace", "who we are"],
  path: "/about",
})

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <AboutHero />
        <MissionSection />
        <StatsSection />
        <ServicesSection />
        <TeamSection />
        <CallToAction />
      </main>
      <SiteFooter />
    </div>
  )
}
