import { Suspense } from "react"
import { CheckCircle, Home, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function PaymentSuccessContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-gray-600">
              Your payment has been processed successfully. You'll receive a confirmation email shortly.
            </p>
            <p className="text-sm text-gray-500">
              Your booking is now confirmed and you can view it in your dashboard.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <Calendar className="mr-2 h-4 w-4" />
                View My Bookings
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">Need help? Contact our support team at support@spaceongo.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
