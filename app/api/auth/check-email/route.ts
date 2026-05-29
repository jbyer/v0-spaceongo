import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    console.log("[v0] Email check API called with:", email)

    // Validate email presence
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          error: "Email is required",
          exists: false,
          available: false,
        },
        { status: 400 },
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    console.log("[v0] Trimmed email:", trimmedEmail)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
          exists: false,
          available: false,
          message: "Please enter a valid email address",
        },
        { status: 400 },
      )
    }

    // Additional email validation rules
    if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
      return NextResponse.json(
        {
          error: "Email length invalid",
          exists: false,
          available: false,
          message: "Email must be between 5 and 254 characters",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Check if email exists in profiles table
    const { data, error } = await supabase.from("profiles").select("id, email").eq("email", trimmedEmail).maybeSingle()

    console.log("[v0] Database query result:")
    console.log("[v0]   - data:", data)
    console.log("[v0]   - error:", error)
    console.log("[v0]   - exists (data !== null):", data !== null)
    console.log("[v0]   - available (!exists):", data === null)

    if (error) {
      console.error("[v0] Email check database error:", error)
      return NextResponse.json(
        {
          error: "Failed to check email availability",
          exists: false,
          available: false,
          message: "Unable to verify email availability. Please try again.",
        },
        { status: 500 },
      )
    }

    // Email exists if data is returned
    const exists = data !== null
    const available = !exists

    console.log("[v0] Sending response:", {
      exists,
      available,
      message: exists ? "An account with this email already exists. Please sign in instead." : "Email is available",
    })

    // Return success response with cache headers
    const response = NextResponse.json(
      {
        exists,
        available,
        message: exists ? "An account with this email already exists. Please sign in instead." : "Email is available",
      },
      { status: 200 },
    )

    // Add cache headers to prevent caching of email checks
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("[v0] Email check exception:", error)

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid request format",
          exists: false,
          available: false,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        exists: false,
        available: false,
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    )
  }
}

// Add GET method for health check
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      endpoint: "check-email",
      methods: ["POST"],
    },
    { status: 200 },
  )
}
