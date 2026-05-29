"use client"

import { SiteHeader } from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import DashboardSidebar from "@/components/dashboard-sidebar"
import UserProfileForm from "@/components/user-profile-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ProfilePage() {
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(false)
  const [isHost, setIsHost] = useState<boolean>(false)

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true)
      // Hide welcome message after 10 seconds
      const timer = setTimeout(() => setShowWelcome(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  useEffect(() => {
    const supabase = createClient()

    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("is_host").eq("id", user.id).single()

      if (profile) {
        setIsHost(profile.is_host)
      }
    }

    fetchRole()

    const channel = supabase
      .channel("profile-page-role-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (payload.new && "is_host" in payload.new) {
            setIsHost(payload.new.is_host as boolean)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const bgClass = "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200"

  return (
    <div className={`min-h-screen transition-colors duration-500 ${bgClass}`}>
      <SiteHeader />
      <div className="flex">
        <DashboardSidebar activeTab="profile" />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {showWelcome && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Welcome to SpaceOnGo!</strong> Your email has been verified successfully. Please complete your
                  profile to get started.
                </AlertDescription>
              </Alert>
            )}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600 mt-1">Manage your personal information and account settings</p>
            </div>
            <UserProfileForm />
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
