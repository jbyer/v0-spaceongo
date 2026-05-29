"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import AdminSidebar from "@/components/admin-sidebar"
import AdminAddSpaceForm from "@/components/admin-add-space-form"
import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function AdminAddSpacePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("add-space")
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
          setTimeout(() => router.push("/login"), 2000)
          return
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_superuser")
          .eq("id", user.id)
          .single()

        if (error || !profile || !profile.is_superuser) {
          setIsAuthorized(false)
          setTimeout(() => router.push("/dashboard"), 2000)
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Authentication check failed:", error)
        setIsAuthorized(false)
        setTimeout(() => router.push("/login"), 2000)
      }
    }

    checkAuth()
  }, [router])

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying superuser access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Alert variant="destructive" className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm mt-1">Redirecting...</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex flex-1">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/admin">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-red-600" />
                <h1 className="text-3xl font-bold text-gray-900">Add New Space (Admin)</h1>
              </div>
              <p className="text-gray-600 mt-2">
                As an admin, you can create a space listing and assign it to any host user in the system.
              </p>
            </div>
            <AdminAddSpaceForm />
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
