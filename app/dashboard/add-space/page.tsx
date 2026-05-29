"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import DashboardSidebar from "@/components/dashboard-sidebar"
import AddSpaceForm from "@/components/add-space-form"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AddSpacePage() {
  const [activeTab, setActiveTab] = useState("add-space")
  const searchParams = useSearchParams()
  const isFresh = searchParams.get("fresh") === "true"

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex flex-1">
        <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/dashboard">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Add New Space</h1>
              <p className="text-gray-600 mt-2">List your space and start earning money by renting it out to others.</p>
            </div>
            <AddSpaceForm isFreshStart={isFresh} />
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
