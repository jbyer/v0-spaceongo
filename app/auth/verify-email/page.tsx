import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <Mail className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Email Verification Required</CardTitle>
              <CardDescription>Please verify your email address to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your email address has not been verified yet. Please check your inbox for a verification link.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-gray-600">
                <p>To complete your registration:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Check your email inbox</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here to sign in</li>
                </ol>
              </div>

              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Return to Login</Link>
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500">
                Didn't receive the email? Check your spam folder or contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
