import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Authentication Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">Error: {params.error}</p>
                  {params.error_description && (
                    <p className="text-sm text-muted-foreground">{params.error_description}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">An authentication error occurred. Please try again.</p>
              )}
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/auth/login">Try Again</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Return to Homepage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
