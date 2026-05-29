import { Suspense } from "react"
import { XCircle, ArrowLeft, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function PaymentFailedContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-gray-600">
              We couldn't process your payment. This could be due to insufficient funds, an expired card, or other
              issues.
            </p>
            <p className="text-sm text-gray-500">Please check your payment details and try again.</p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/booking/payment">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/all-spaces">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Spaces
              </Link>
            </Button>

            <Button variant="ghost" asChild className="w-full">
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

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  )
}
