import { Resend } from "resend"

// Singleton pattern for Resend client
let resendClient: Resend | null = null

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - email sending will be disabled")
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }

  return resendClient
}

// Email configuration
export const EMAIL_CONFIG = {
  // Use verified domain or Resend's test domain for development
  fromEmail: process.env.RESEND_FROM_EMAIL || "SpaceOnGo <onboarding@resend.dev>",
  replyTo: process.env.RESEND_REPLY_TO || "support@spaceon.go",
  appName: "SpaceOnGo",
  supportEmail: "info@spaceongo.com",
}
