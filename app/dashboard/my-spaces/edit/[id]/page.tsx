"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import SiteHeader from "@/components/site-header"
import DashboardSidebar from "@/components/dashboard-sidebar"
import EditSpaceForm from "@/components/edit-space-form"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import type { Database } from "@/lib/database.types"

type Space = Database["public"]["Tables"]["spaces"]["Row"]

export default function EditSpacePage() {
  const params = useParams()
  const router = useRouter()
  const spaceId = params.id as string
  const [space, setSpace] = useState<Space | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSpace() {
      try {
        setIsLoading(true)
        setError(null)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Please log in to edit your space")
          setIsLoading(false)
          return
        }

        // Fetch the space
        const { data, error: fetchError } = await supabase
          .from("spaces")
          .select("*")
          .eq("id", spaceId)
          .eq("host_id", user.id) // Ensure user owns this space
          .single()

        if (fetchError) {
          console.error("[v0] Error fetching space:", fetchError)
          setError("Space not found or you don't have permission to edit it")
          setIsLoading(false)
          return
        }

        setSpace(data)
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Error in fetchSpace:", err)
        setError("An unexpected error occurred")
        setIsLoading(false)
      }
    }

    if (spaceId) {
      fetchSpace()
    }
  }, [spaceId])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex flex-1">
          <DashboardSidebar activeTab="spaces" />
          <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading space details...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !space) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex flex-1">
          <DashboardSidebar activeTab="spaces" />
          <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-red-600 mb-4">{error || "Space not found"}</p>
                  <Link href="/dashboard/my-spaces">
                    <Button>Back to My Spaces</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex flex-1">
        <DashboardSidebar activeTab="spaces" />
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/dashboard/my-spaces">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Spaces
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Edit Space</h1>
              <p className="text-gray-600 mt-2">Update your space information and settings.</p>
            </div>
            <EditSpaceForm space={space} />
          </div>
        </main>
      </div>
    </div>
  )
}
