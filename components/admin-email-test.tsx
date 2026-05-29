"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Mail, Loader2 } from "lucide-react"

export function AdminEmailTest() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
    recommendations?: string[]
    error?: string
  } | null>(null)

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to test email delivery",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Delivery Test
        </CardTitle>
        <CardDescription>Test email confirmation delivery by sending a test email to any address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTestEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">A test confirmation email will be sent to this address</p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-4 space-y-3">
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="font-medium">{result.message}</div>
                {result.error && <div className="text-sm mt-1">{result.error}</div>}
              </AlertDescription>
            </Alert>

            {result.details && (
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="font-medium">Details:</div>
                {result.details.email && (
                  <div>
                    <span className="text-muted-foreground">Email:</span> {result.details.email}
                  </div>
                )}
                {result.details.userId && (
                  <div>
                    <span className="text-muted-foreground">User ID:</span> {result.details.userId}
                  </div>
                )}
                {result.details.emailConfirmationRequired !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Confirmation Required:</span>{" "}
                    {result.details.emailConfirmationRequired ? "Yes" : "No"}
                  </div>
                )}
                {result.details.note && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                    {result.details.note}
                  </div>
                )}
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <div className="font-medium text-sm text-amber-900 mb-2">Recommendations:</div>
                <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                  {result.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">Troubleshooting Steps:</div>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Check spam/junk folder for the confirmation email</li>
            <li>Verify email confirmation is enabled in Supabase Dashboard</li>
            <li>Check email templates are configured correctly</li>
            <li>Review Supabase Auth logs for delivery status</li>
            <li>Ensure SMTP settings are correct (if using custom provider)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
