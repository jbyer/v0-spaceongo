"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Send, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ResendVerificationButtonProps {
  email: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  text?: string
}

export function ResendVerificationButton({
  email,
  variant = "outline",
  className,
  text = "Resend Verification Email",
}: ResendVerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const { toast } = useToast()

  const handleResend = async () => {
    if (!email) return

    setIsLoading(true)

    try {
      const resendResponse = await fetch("/api/resend/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const resendData = await resendResponse.json()

      // If Resend succeeded or email already verified
      if (resendResponse.ok) {
        if (resendData.alreadyVerified) {
          toast({
            title: "Already Verified",
            description: "Your email is already verified. You can sign in now.",
          })
        } else {
          setIsSent(true)
          toast({
            title: "Email sent",
            description: `Verification email sent to ${email}`,
          })
          // Reset sent state after 60 seconds
          setTimeout(() => setIsSent(false), 60000)
        }
        return
      }

      // If Resend failed with fallback suggestion, use Supabase
      if (resendData.fallback === "supabase") {
        console.log("[v0] Falling back to Supabase email")
        const supabase = createClient()

        if (!supabase) {
          throw new Error("Authentication service unavailable")
        }

        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
          },
        })

        if (error) throw error

        setIsSent(true)
        toast({
          title: "Email sent",
          description: `Verification email sent to ${email}`,
        })
        setTimeout(() => setIsSent(false), 60000)
        return
      }

      // Other error
      throw new Error(resendData.error || "Failed to send verification email")
    } catch (error: unknown) {
      console.error("[v0] Error resending verification:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to resend verification email. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <Button variant="ghost" disabled className={className}>
        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
        Email Sent
      </Button>
    )
  }

  return (
    <Button variant={variant} onClick={handleResend} disabled={isLoading || !email} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          {text}
        </>
      )}
    </Button>
  )
}
