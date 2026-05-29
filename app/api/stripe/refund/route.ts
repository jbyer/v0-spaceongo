import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { serverPaymentAPI } from "@/lib/api/payments"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, amount, reason } = await request.json()

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Check if user owns the payment or is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (payment.user_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Process refund with Stripe
    const refund = await serverPaymentAPI.processRefund(payment.stripe_payment_intent_id, amount, reason)

    // Update payment record
    await serverPaymentAPI.updatePaymentStatus(paymentId, "refunded", {
      refund_id: refund.id,
      refund_amount: refund.amount / 100,
      refund_reason: reason,
    })

    return NextResponse.json({
      success: true,
      refund,
    })
  } catch (error) {
    console.error("Error processing refund:", error)
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
  }
}
