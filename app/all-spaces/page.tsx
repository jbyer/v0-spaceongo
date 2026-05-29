import { createMetadata } from "@/lib/seo/metadata"
import AllSpacesClient from "./all-spaces-client"

export const metadata = createMetadata({
  title: "SpaceOnGo | Browse All Spaces - Thousands of spaces Available",
  description:
    "Browse our complete collection of available spaces. From private offices to event venues, find the perfect workspace for your needs. Filter by type, location, price, and amenities.",
  keywords: [
    "all spaces",
    "workspace directory",
    "office listings",
    "event space listings",
    "coworking spaces",
    "storage facilities",
  ],
  path: "/all-spaces",
})

export default function AllSpacesPage() {
  return <AllSpacesClient />
}
