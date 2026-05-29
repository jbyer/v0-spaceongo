"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Building2, Users } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function VerificationSuccessContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role")
  const isHost = role === "host"

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Email Verified!</CardTitle>
          <CardDescription>
            {isHost
              ? "Your host account has been successfully verified"
              : "Your account has been successfully verified"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {isHost
              ? "Congratulations! Your email has been verified and your SpaceOnGo host account is now fully activated. You can now start listing your spaces and earning money!"
              : "Congratulations! Your email address has been verified and your SpaceOnGo account is now fully activated. You can now access all features of the platform."}
          </p>

          {isHost ? (
            <>
              {/* Host-specific content */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900 mb-2">Ready to list your space!</h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>Add photos and description of your space</li>
                      <li>Set your availability and pricing</li>
                      <li>Start receiving booking requests</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href="/dashboard/add-space">
                    List Your First Space
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/dashboard">Go to Host Dashboard</Link>
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 text-center">
                  <strong>Tip:</strong> Complete your profile with a photo to build trust with potential renters.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Renter-specific content */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">{"What's next?"}</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>Complete your profile with a photo and bio</li>
                      <li>Browse available spaces near you</li>
                      <li>Or list your own space to start earning</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button asChild className="w-full">
                  <Link href="/dashboard/profile">
                    Complete Your Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/all-spaces">Browse Spaces</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerificationSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <Suspense fallback={<div>Loading...</div>}>
          <VerificationSuccessContent />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  )
}
