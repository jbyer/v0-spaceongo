import { Skeleton } from "@/components/ui/skeleton"

export default function AddSpaceLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-16 border-b bg-white">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex flex-1">
        <div className="w-64 border-r bg-white">
          <Skeleton className="h-full w-full" />
        </div>
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Skeleton className="h-10 w-40 mb-4" />
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
