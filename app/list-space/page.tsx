import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import ListSpaceHero from "@/components/list-space-hero"
import HostGuide from "@/components/host-guide"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "List Your Space - Earn Money as a Host",
  description:
    "Become a space host on SpaceOnGo and start earning. List your office, event space, or storage facility. Join thousands of hosts earning passive income with flexible bookings.",
  keywords: [
    "list space",
    "become a host",
    "rent out office",
    "earn money from space",
    "property rental",
    "host workspace",
  ],
  path: "/list-space",
})

export default function ListSpacePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 bg-gradient-to-br from-green-50 to-blue-50">
        <ListSpaceHero />
        <HostGuide />
      </main>
      <SiteFooter />
    </div>
  )
}
