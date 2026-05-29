import { loadStripe } from "@stripe/stripe-js"
import { STRIPE_CONFIG } from "./config"

// Client-side Stripe instance
let stripePromise: Promise<any> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey)
  }
  return stripePromise
}

// Payment intent creation
export async function createPaymentIntent(amount: number, metadata?: Record<string, string>) {
  const response = await fetch("/api/stripe/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to cents
      currency: STRIPE_CONFIG.currency,
      metadata,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to create payment intent")
  }

  return response.json()
}

// Customer creation
export async function createCustomer(email: string, name?: string) {
  const response = await fetch("/api/stripe/create-customer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, name }),
  })

  if (!response.ok) {
    throw new Error("Failed to create customer")
  }

  return response.json()
}
