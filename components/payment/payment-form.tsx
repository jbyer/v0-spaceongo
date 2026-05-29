"use client"

import type React from "react"

import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { getStripe } from "@/lib/stripe/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, Shield, Lock } from "lucide-react"
import { useCurrency } from "@/contexts/currency-context"

interface PaymentFormProps {
  clientSecret: string
  amount: number
  onSuccess?: (paymentIntent: any) => void
  onError?: (error: string) => void
  returnUrl?: string
}

function PaymentFormContent({ amount, onSuccess, onError, returnUrl }: Omit<PaymentFormProps, "clientSecret">) {
  const stripe = useStripe()
  const elements = useElements()
  const { formatPrice } = useCurrency()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/payment/success`,
        },
        redirect: "if_required",
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess?.(paymentIntent)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Shield className="h-4 w-4" />
          <span>Secured by Stripe</span>
        </div>

        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card", "apple_pay", "google_pay"],
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total:</span>
          <span>{formatPrice(amount)}</span>
        </div>

        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Pay {formatPrice(amount)}
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          <span>Your payment information is encrypted and secure</span>
        </div>
      </div>
    </form>
  )
}

export function PaymentForm({ clientSecret, amount, onSuccess, onError, returnUrl }: PaymentFormProps) {
  const [stripePromise] = useState(() => getStripe())

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>Complete your payment securely with Stripe</CardDescription>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#2563eb",
                colorBackground: "#ffffff",
                colorText: "#1f2937",
                colorDanger: "#ef4444",
                fontFamily: "Inter, system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "8px",
              },
            },
          }}
        >
          <PaymentFormContent amount={amount} onSuccess={onSuccess} onError={onError} returnUrl={returnUrl} />
        </Elements>
      </CardContent>
    </Card>
  )
}
