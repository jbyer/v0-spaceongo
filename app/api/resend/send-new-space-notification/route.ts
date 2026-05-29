import { NextResponse, type NextRequest } from "next/server"
import { getResendClient, EMAIL_CONFIG } from "@/lib/resend"
import { NewSpaceNotificationEmail } from "@/components/emails/new-space-notification-email"

interface SendNewSpaceNotificationRequest {
  spaceName: string
  spaceType: string
  hostName: string
  address: string
  city: string
  state: string
  zipCode: string
  capacity: number
  hourlyRate?: number
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  description?: string
  amenities?: string[]
  spaceId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendNewSpaceNotificationRequest = await request.json()

    // Validate required fields
    if (!body.spaceName || !body.spaceId) {
      return NextResponse.json(
        { error: "Missing required fields: spaceName, spaceId" },
        { status: 400 }
      )
    }

    const resend = getResendClient()
    if (!resend) {
      console.error("Resend client not configured")
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      )
    }

    const listingDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Send email to admin
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to: "jason@spaceongo.com",
      subject: `New Space Listed: ${body.spaceName}`,
      react: NewSpaceNotificationEmail({
        spaceName: body.spaceName,
        spaceType: body.spaceType,
        hostName: body.hostName,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        capacity: body.capacity,
        hourlyRate: body.hourlyRate,
        dailyRate: body.dailyRate,
        weeklyRate: body.weeklyRate,
        monthlyRate: body.monthlyRate,
        description: body.description,
        amenities: body.amenities,
        listingDate,
        spaceId: body.spaceId,
      }),
    })

    if (error) {
      console.error("Failed to send new space notification email:", error)
      // Don't fail the space creation if email fails - log and continue
      return NextResponse.json(
        {
          warning: "Space created but notification email failed to send",
          error: error.message,
        },
        { status: 202 }
      )
    }

    console.log("[v0] New space notification email sent successfully:", data)

    return NextResponse.json(
      {
        success: true,
        message: "Notification email sent to admin",
        emailId: data?.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in send-new-space-notification:", error)
    // Return 202 to indicate the request was processed but there was an issue with email
    // This prevents space creation from failing due to email service issues
    return NextResponse.json(
      {
        warning: "Space creation may have succeeded but notification email failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 202 }
    )
  }
}
