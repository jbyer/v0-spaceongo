import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogList } from "@/components/blog-list"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "SpaceOnGo Blog | Insights on Workspace, Productivity, and Business",
  description:
    "Explore the SpaceOnGo blog for expert tips on finding the best coworking offices, meeting rooms, and creative spaces. Boost your productivity with our latest business insights.",
  keywords: ["workspace blog", "office space tips", "productivity", "space management", "coworking insights"],
  path: "/blog",
})

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <BlogList />
      </main>
      <SiteFooter />
    </div>
  )
}
