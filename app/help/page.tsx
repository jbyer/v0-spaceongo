import SiteHeader from "@/components/site-header"
import HelpHero from "@/components/help-hero"
import HelpSearch from "@/components/help-search"
import HelpCategories from "@/components/help-categories"
import ContactSupport from "@/components/contact-support"
import SiteFooter from "@/components/site-footer"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "Help Center - Support & FAQs",
  description:
    "Get help with SpaceOnGo. Find answers to frequently asked questions about bookings, payments, hosting, account management, and more. Contact our support team 24/7.",
  keywords: ["help", "support", "faq", "customer service", "contact support", "troubleshooting"],
  path: "/help",
})

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <HelpHero />
        <div className="container mx-auto px-4 py-8">
          <HelpSearch />
          <HelpCategories />
          <ContactSupport />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
