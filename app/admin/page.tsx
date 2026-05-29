"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import AdminSidebar from "@/components/admin-sidebar"
import AdminOverview from "@/components/admin-overview"
import AdminSpacesList from "@/components/admin-spaces-list"
import AdminFinancialReports from "@/components/admin-financial-reports"
import AdminUserManagement from "@/components/admin-user-management"
import SecurityDashboard from "@/components/security-dashboard"
import SuperuserManagement from "@/components/superuser-management"
import AdminFeaturedSettings from "@/components/admin-featured-settings"
import AdminAllSpacesSettings from "@/components/admin-all-spaces-settings"
import AdminBlogManagement from "@/components/admin-blog-management"
import { AdminChatbotSettings } from "@/components/admin-chatbot-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, CheckCircle } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Error getting current user:", userError)
          setIsAuthorized(false)
          setTimeout(() => {
            router.push("/login")
          }, 3000)
          return
        }

        const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error || !profile) {
          console.error("Error fetching user profile:", error)
          setIsAuthorized(false)
          setTimeout(() => {
            router.push("/login")
          }, 3000)
          return
        }

        if (!profile.is_superuser) {
          setIsAuthorized(false)
          setUserInfo(profile)
          setTimeout(() => {
            router.push("/dashboard")
          }, 3000)
          return
        }

        setIsAuthorized(true)
        setUserInfo(profile)
      } catch (error) {
        console.error("Authentication check failed:", error)
        setIsAuthorized(false)
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    }

    checkAuth()

    const tab = searchParams.get("tab")
    if (tab === "pending") {
      router.push("/admin/pending")
    }
  }, [router, searchParams])

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
          <div className="max-w-md w-full mx-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Access Denied</p>
                  <p>
                    You don't have permission to access the admin dashboard. This area is restricted to superuser
                    accounts only.
                  </p>
                  {userInfo && (
                    <div className="text-sm bg-red-100 p-2 rounded mt-2">
                      <p>Current user: {userInfo.email}</p>
                      <p>Role: {userInfo.is_superuser ? "superuser" : "user"}</p>
                    </div>
                  )}
                  <p className="text-sm">Redirecting to login page...</p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />
      case "spaces":
        return <AdminSpacesList />
      case "reports":
        return <AdminFinancialReports />
      case "users":
        return <AdminUserManagement />
      case "security":
        return <SecurityDashboard />
      case "superuser":
        return <SuperuserManagement />
      case "featured":
        return <AdminFeaturedSettings />
      case "all-spaces":
        return <AdminAllSpacesSettings />
      case "blog":
        return <AdminBlogManagement />
      case "chatbot":
        return <AdminChatbotSettings />
      default:
        return <AdminOverview />
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <div className="bg-green-50 border-b border-green-200 px-6 py-2">
        <div className="flex items-center gap-2 text-sm text-green-800">
          <CheckCircle className="h-4 w-4" />
          <span>
            Welcome, {userInfo?.display_name || userInfo?.first_name || userInfo?.email}! You have superuser access to
            the admin dashboard.
          </span>
        </div>
      </div>

      <div className="flex flex-1">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">{renderContent()}</main>
      </div>
      <SiteFooter />
    </div>
  )
}
