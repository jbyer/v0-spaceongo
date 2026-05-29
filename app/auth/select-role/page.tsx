"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Home, Users, Loader2, AlertCircle } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SelectRolePage() {
  const [userRole, setUserRole] = useState<"renter" | "host">("renter")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get user's name from metadata or profile
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        `${user.user_metadata?.given_name || ""} ${user.user_metadata?.family_name || ""}`.trim() ||
        user.email?.split("@")[0] ||
        "there"

      setUserName(displayName)

      // Check if user already has a role set
      const { data: profile } = await supabase.from("profiles").select("is_host").eq("id", user.id).single()

      if (profile && profile.is_host !== null) {
        router.push("/dashboard")
      }
    }

    checkUser()
  }, [router])

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No authenticated user found")
      }

      // Update the user's profile with the selected role
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_host: userRole === "host",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      // Redirect based on role
      const redirectTo = searchParams.get("next") || "/dashboard"
      router.push(redirectTo)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save your selection. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome{userName ? `, ${userName}` : ""}!</CardTitle>
              <CardDescription>Let's personalize your experience. How would you like to use SpaceOnGo?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-2">
                  <Label className="text-base font-semibold">I want to</Label>
                  <RadioGroup
                    value={userRole}
                    onValueChange={(value) => setUserRole(value as "renter" | "host")}
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                      <RadioGroupItem value="renter" id="renter" />
                      <Label htmlFor="renter" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="flex-shrink-0">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-base">Rent spaces</div>
                          <div className="text-sm text-gray-600">Find and book amazing spaces for your needs</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                      <RadioGroupItem value="host" id="host" />
                      <Label htmlFor="host" className="flex items-center gap-3 cursor-pointer flex-1">
                        <div className="flex-shrink-0">
                          <Home className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-base">List my space</div>
                          <div className="text-sm text-gray-600">Share your space and earn money</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Don't worry! You can change this later in your profile settings.
                  </p>
                </div>

                <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up your account...
                    </>
                  ) : (
                    "Continue to Dashboard"
                  )}
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
