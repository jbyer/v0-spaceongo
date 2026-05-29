"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import AdminPendingApprovalsScreen from "@/components/admin-pending-approvals-screen"
import { createClient } from "@/lib/supabase/client"

export default function PendingApprovalsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setIsAuthorized(false)
          router.push("/login")
          return
        }

        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error || !profile || !profile.is_superuser) {
          setIsAuthorized(false)
          router.push("/dashboard")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Authentication check failed:", error)
        setIsAuthorized(false)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push("/admin")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </div>

          <AdminPendingApprovalsScreen />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
