"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Mail, ExternalLink } from "lucide-react"

interface DiagnosticResult {
  timestamp: string
  status: string
  checks: Record<string, string>
  environmentVariables: Record<string, string>
  emailConfiguration: Record<string, string>
  recommendations: string[]
}

export default function EmailDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const runDiagnostics = async () => {
    setIsLoading(true)
    setDiagnostics(null)

    try {
      const response = await fetch("/api/resend/test-connection")
      const data = await response.json()
      setDiagnostics(data)
    } catch (error) {
      console.error("[v0] Failed to run diagnostics:", error)
      setDiagnostics({
        timestamp: new Date().toISOString(),
        status: "ERROR",
        checks: {},
        environmentVariables: {},
        emailConfiguration: {},
        recommendations: ["Failed to connect to diagnostic endpoint"],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      setTestResult({ success: false, message: "Please enter a valid email address" })
      return
    }

    setIsSendingTest(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/resend/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Test email sent successfully! Email ID: ${data.emailId || "N/A"}`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to send test email",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const getStatusIcon = (checkText: string) => {
    if (checkText.startsWith("✅")) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (checkText.startsWith("❌")) return <XCircle className="h-4 w-4 text-red-600" />
    if (checkText.startsWith("⚠️")) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Email Service Diagnostics</h1>
            <p className="text-muted-foreground">
              Test and troubleshoot your Resend email integration to ensure verification emails are delivered
              successfully.
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Not receiving verification emails?</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Run diagnostics below to check your configuration</li>
                  <li>Send a test email to confirm delivery</li>
                  <li>Check your spam/junk folder</li>
                  <li>
                    If using a custom domain, verify it in{" "}
                    <a
                      href="https://resend.com/domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Resend Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                  <li>
                    For testing, use <code className="bg-muted px-1 rounded">onboarding@resend.dev</code> as sender
                  </li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
          {/* End of added step-by-step guide banner */}

          <Card>
            <CardHeader>
              <CardTitle>Run Diagnostics</CardTitle>
              <CardDescription>
                Check your Resend configuration, API key validity, and environment setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={runDiagnostics} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Diagnostics
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {diagnostics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Status:{" "}
                    <span
                      className={
                        diagnostics.status === "CONFIGURED"
                          ? "text-green-600"
                          : diagnostics.status === "ERROR"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }
                    >
                      {diagnostics.status}
                    </span>
                  </CardTitle>
                  <CardDescription>Last checked: {new Date(diagnostics.timestamp).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Configuration Checks</h3>
                    <div className="space-y-2">
                      {Object.entries(diagnostics.checks).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2 text-sm">
                          {getStatusIcon(value)}
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground">{value.replace(/^[✅❌⚠️]\s*/, "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Environment Variables</h3>
                    <div className="bg-muted rounded-lg p-3 space-y-1 font-mono text-xs">
                      {Object.entries(diagnostics.environmentVariables).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Email Configuration</h3>
                    <div className="bg-muted rounded-lg p-3 space-y-1 text-sm">
                      {Object.entries(diagnostics.emailConfiguration).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-mono text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {diagnostics.recommendations.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold mb-2">Recommendations:</div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {diagnostics.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Send Test Email</CardTitle>
                  <CardDescription>
                    Send a test verification email to confirm your Resend integration is working
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      disabled={isSendingTest}
                    />
                    <Button onClick={sendTestEmail} disabled={isSendingTest}>
                      {isSendingTest ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Test
                        </>
                      )}
                    </Button>
                  </div>

                  {testResult && (
                    <Alert variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <AlertDescription>{testResult.message}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">1. Emails not arriving</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Check spam/junk folder</li>
                    <li>Verify domain in Resend dashboard (if using custom domain)</li>
                    <li>Confirm API key is valid and not revoked</li>
                    <li>Check rate limits (free tier: 100 emails/day)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">2. API Key Issues</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Ensure RESEND_API_KEY starts with "re_"</li>
                    <li>Generate new key if current one is revoked</li>
                    <li>Restart your application after adding/changing keys</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">3. Domain Verification</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Add DNS records (SPF, DKIM) to your domain</li>
                    <li>
                      <strong>Quick Fix:</strong> Use onboarding@resend.dev for testing (no verification needed)
                    </li>
                    <li>
                      Visit{" "}
                      <a
                        href="https://resend.com/domains"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Resend Dashboard
                        <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      to manage domains
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">4. Testing with Resend Test Domain</h4>
                  <div className="bg-muted rounded p-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      To bypass domain verification for testing, set this environment variable:
                    </p>
                    <code className="text-xs">RESEND_FROM_EMAIL=onboarding@resend.dev</code>
                    <p className="text-xs text-muted-foreground mt-2">Then restart your application.</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">5. Where to Check Logs</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>
                      <strong>Browser Console:</strong> Open DevTools (F12) → Console tab during registration
                    </li>
                    <li>
                      <strong>Resend Dashboard:</strong>{" "}
                      <a
                        href="https://resend.com/emails"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View recent emails
                      </a>
                    </li>
                    <li>
                      <strong>Server Logs:</strong> Check your hosting platform's logs for error messages
                    </li>
                  </ul>
                </div>
                {/* End of added more troubleshooting sections */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>Comprehensive troubleshooting documentation available</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                For detailed step-by-step troubleshooting instructions, including how to fix domain verification, check
                API keys, and resolve common configuration issues, see the complete guide:
              </p>
              <Button variant="outline" asChild>
                <a href="/docs/EMAIL_TROUBLESHOOTING_GUIDE.md" target="_blank" rel="noreferrer">
                  View Full Troubleshooting Guide
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
          {/* End of added documentation link */}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
