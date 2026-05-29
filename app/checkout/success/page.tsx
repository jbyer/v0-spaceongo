"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Mail, Calendar, XCircle } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const processedRef = useRef(false)

  useEffect(() => {
    if (!sessionId || processedRef.current) return
    processedRef.current = true

    const confirmBooking = async () => {
      try {
        // Call our API to confirm the booking and send the email
        const response = await fetch("/api/bookings/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to confirm booking")
        }

        setEmailSent(result.emailSent === true)
        setStatus("success")
      } catch (err) {
        console.error("Error confirming booking:", err)
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong")
        setStatus("error")
      }
    }

    confirmBooking()
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Session</h2>
          <p className="text-muted-foreground">No checkout session found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {status === "loading" && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-blue-600" />
            <h2 className="text-2xl font-bold mb-2">Confirming Your Booking</h2>
            <p className="text-muted-foreground">
              Please wait while we process your payment and send your confirmation...
            </p>
          </CardContent>
        </Card>
      )}

      {status === "success" && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Booking Confirmed!</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Your payment has been processed successfully.
            </p>

            {emailSent && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-4 mb-8">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>A confirmation email has been sent to your registered email address.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/dashboard/bookings">
                  <Calendar className="w-4 h-4 mr-2" />
                  View My Bookings
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="bg-transparent">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "error" && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Something Went Wrong</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage || "We couldn't confirm your booking. Please check your bookings page or contact support."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/dashboard/bookings">Check My Bookings</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="bg-transparent">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Suspense
          fallback={
            <div className="container mx-auto px-4 py-12">
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              </div>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
