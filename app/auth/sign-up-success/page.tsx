"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { ResendVerificationButton } from "@/components/auth/resend-verification-button"
import { Suspense } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertCircle, HelpCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function SignUpSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const emailError = searchParams.get("error")
  const role = searchParams.get("role")
  const isHost = role === "host"

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            {isHost
              ? "Verify your email to start listing spaces"
              : "We've sent you a confirmation link"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isHost && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <p className="text-sm text-green-800 font-medium">
                You&apos;re almost ready to become a Space Host!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Once verified, you&apos;ll have access to listing tools and your host dashboard.
              </p>
            </div>
          )}

          {emailError === "email_send_failed" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email Delivery Issue</AlertTitle>
              <AlertDescription className="text-sm">
                Your account was successfully created, but there was a problem sending the confirmation email. Please
                contact support@spaceongo.com to manually verify your account.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            You&apos;ve successfully signed up for SpaceOnGo!
            {email && (
              <>
                {" "}
                We sent a verification email to <span className="font-medium text-foreground">{email}</span>.
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your email and click the confirmation link to activate your account.
          </p>

          {email && !emailError && (
            <div className="py-2">
              <ResendVerificationButton email={email} className="w-full" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild variant={email ? "outline" : "default"}>
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Return to Homepage</Link>
            </Button>
          </div>

          <div className="mt-6 border-t pt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="troubleshooting" className="border-none">
                <AccordionTrigger className="text-sm text-muted-foreground py-2 hover:no-underline hover:text-foreground">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Didn't receive the email?
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong>Check Spam/Junk:</strong> The email may have landed in your spam or junk folder.
                      </li>
                      <li>
                        <strong>Wait 1-2 Minutes:</strong> Email delivery can sometimes be delayed.
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <Suspense fallback={<div>Loading...</div>}>
          <SignUpSuccessContent />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  )
}
