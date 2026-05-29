import { createMetadata } from "@/lib/seo/metadata"
import FindSpaceClientPage from "./client-page"

export const metadata = createMetadata({
  title: "Find & Book Workspace - Offices, Event Spaces & More",
  description:
    "Search and book flexible workspaces, offices, conference rooms, event venues, and storage spaces. Filter by location, capacity, amenities, and price. Book instantly with no lease required.",
  keywords: [
    "find workspace",
    "search office space",
    "book conference room",
    "event venue near me",
    "flexible workspace search",
    "coworking space finder",
  ],
  path: "/find-space",
})

export default function FindSpacePage() {
  return <FindSpaceClientPage />
}
