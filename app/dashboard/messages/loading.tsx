import { SiteHeader } from "@/components/site-header"
import DashboardSidebar from "@/components/dashboard-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <SiteHeader />
      <div className="flex">
        <DashboardSidebar activeTab="messages" />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>

            {/* Stats Cards Loading */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="ml-4 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Messages Interface Loading */}
            <Card className="h-[600px]">
              <div className="flex h-full">
                <div className="w-1/3 border-r border-gray-200 p-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-10 w-full mb-4" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <Skeleton className="h-32 w-64" />
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
