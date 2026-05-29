import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/config"
import { getStripe, createPaymentIntent, createCustomer } from "@/lib/stripe/client"
import type { Database } from "@/lib/database.types"

type Payment = Database["public"]["Tables"]["payments"]["Row"]
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"]

// Client-side payment functions
export class PaymentAPI {
  private supabase = createClient()

  // Create payment intent for booking
  async createBookingPayment(bookingId: string, amount: number, spaceId: string) {
    try {
      const { data: user } = await this.supabase.auth.getUser()
      if (!user.user) throw new Error("User not authenticated")

      // Get or create Stripe customer
      const { data: profile } = await this.supabase
        .from("profiles")
        .select("stripe_customer_id, email, full_name")
        .eq("id", user.user.id)
        .single()

      let customerId = profile?.stripe_customer_id

      if (!customerId && profile) {
        const customer = await createCustomer(profile.email, profile.full_name || undefined)
        customerId = customer.customerId
      }

      // Create payment intent
      const paymentIntent = await createPaymentIntent(amount, {
        bookingId,
        spaceId,
        customerId: customerId || "",
        type: "booking",
      })

      return paymentIntent
    } catch (error) {
      console.error("Error creating booking payment:", error)
      throw error
    }
  }

  // Process payment with Stripe Elements
  async confirmPayment(clientSecret: string, elements: any, returnUrl?: string) {
    try {
      const stripe = await getStripe()
      if (!stripe) throw new Error("Stripe not loaded")

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/booking/success`,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return paymentIntent
    } catch (error) {
      console.error("Error confirming payment:", error)
      throw error
    }
  }

  // Get payment history for user
  async getPaymentHistory(userId?: string) {
    try {
      const query = this.supabase
        .from("payments")
        .select(`
          *,
          bookings (
            id,
            start_date,
            end_date,
            spaces (
              title,
              images
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (userId) {
        query.eq("user_id", userId)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching payment history:", error)
      throw error
    }
  }

  // Get payment by ID
  async getPayment(paymentId: string) {
    try {
      const { data, error } = await this.supabase
        .from("payments")
        .select(`
          *,
          bookings (
            id,
            start_date,
            end_date,
            total_amount,
            spaces (
              title,
              images,
              location
            )
          )
        `)
        .eq("id", paymentId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching payment:", error)
      throw error
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number, reason?: string) {
    try {
      const response = await fetch("/api/stripe/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process refund")
      }

      return response.json()
    } catch (error) {
      console.error("Error processing refund:", error)
      throw error
    }
  }
}

// Server-side payment functions
export class ServerPaymentAPI {
  private async getSupabaseClient() {
    return await createClient()
  }

  // Create payment record
  async createPayment(payment: PaymentInsert) {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase.from("payments").insert(payment).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating payment record:", error)
      throw error
    }
  }

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: string, metadata?: Record<string, any>) {
    try {
      const supabase = await this.getSupabaseClient()
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (metadata) {
        updateData.metadata = metadata
      }

      const { data, error } = await supabase.from("payments").update(updateData).eq("id", paymentId).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error updating payment status:", error)
      throw error
    }
  }

  // Get payments for admin
  async getPaymentsForAdmin(filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    offset?: number
  }) {
    try {
      const supabase = await this.getSupabaseClient()
      let query = supabase
        .from("payments")
        .select(`
          *,
          bookings (
            id,
            start_date,
            end_date,
            spaces (
              title,
              location
            )
          ),
          profiles (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching payments for admin:", error)
      throw error
    }
  }

  // Process refund
  async processRefund(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as any,
      })

      return refund
    } catch (error) {
      console.error("Error processing Stripe refund:", error)
      throw error
    }
  }
}

// Export instances
export const paymentAPI = new PaymentAPI()
export const serverPaymentAPI = new ServerPaymentAPI()
