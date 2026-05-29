"use client"

import { useEffect, useState } from "react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import DashboardSidebar from "@/components/dashboard-sidebar"
import DashboardOverview from "@/components/dashboard-overview"
import RenterDashboardOverview from "@/components/renter-dashboard-overview"
import SpacesList from "@/components/spaces-list"
import FinancialSummary from "@/components/financial-summary"
import BookingCalendar from "@/components/booking-calendar"
import PerformanceMetrics from "@/components/performance-metrics"
import { createClient } from "@/lib/supabase/client"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isHost, setIsHost] = useState<boolean | null>(null)
  const [isLoadingRole, setIsLoadingRole] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoadingRole(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("is_host").eq("id", user.id).single()

      setIsHost(profile?.is_host ?? false)
      setIsLoadingRole(false)
    }

    fetchUserRole()

    const channel = supabase
      .channel("profile-role-changes")
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

  const renderContent = () => {
    if (activeTab === "overview") {
      if (isLoadingRole) {
        return (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )
      }
      return isHost ? <DashboardOverview /> : <RenterDashboardOverview />
    }

    switch (activeTab) {
      case "spaces":
        return <SpacesList />
      case "financials":
        return <FinancialSummary />
      case "calendar":
        return <BookingCalendar />
      case "performance":
        return <PerformanceMetrics />
      default:
        return isHost ? <DashboardOverview /> : <RenterDashboardOverview />
    }
  }

  const mainBgClass = isHost
    ? "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200" // Blue gradient for hosts
    : "bg-blue-50/30" // Cool blue tone for renters

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex flex-1">
        <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className={`flex-1 p-6 overflow-auto transition-colors duration-500 ${mainBgClass}`}>
          {renderContent()}
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
