import Stripe from "stripe"

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
})

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: "usd",
  paymentMethods: ["card", "apple_pay", "google_pay"],
  appearance: {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#0ea5e9", // SpaceOnGo blue
      colorBackground: "#ffffff",
      colorText: "#1f2937",
      colorDanger: "#ef4444",
      fontFamily: "Inter, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  },
}

// Webhook configuration
export const WEBHOOK_CONFIG = {
  endpointSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  events: [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
  ],
}
