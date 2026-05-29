import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: user.id,
      },
    })

    // Update user profile with Stripe customer ID
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
    }

    return NextResponse.json({
      customerId: customer.id,
      customer,
    })
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
