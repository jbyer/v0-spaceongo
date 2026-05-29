import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function VerificationSuccessLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 animate-pulse" />
              <div className="h-7 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
              <div className="h-4 w-64 bg-gray-100 rounded mx-auto mt-2 animate-pulse" />
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
