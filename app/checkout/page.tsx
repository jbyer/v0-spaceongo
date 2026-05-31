"use client"

import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Loader2 } from "lucide-react"
import CheckoutContent from "./checkout-content"

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12">
              <div className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-muted-foreground">Loading checkout...</p>
                </div>
              </div>
            </div>
          }
        >
          <CheckoutContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
