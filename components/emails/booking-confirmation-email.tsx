interface BookingConfirmationEmailProps {
  guestName: string
  confirmationNumber: string
  spaceName: string
  spaceType: string
  bookingDate: string
  bookingDuration: string
  startTime?: string
  endTime?: string
  address: string
  city: string
  state: string
  zipCode: string
  maxCapacity?: number
  amenities?: string[]
  description?: string
  totalAmount: string
  serviceFee: string
  taxAmount: string
  finalAmount: string
  hostName: string
  appName?: string
}

export function BookingConfirmationEmail({
  guestName,
  confirmationNumber,
  spaceName,
  spaceType,
  bookingDate,
  bookingDuration,
  startTime,
  endTime,
  address,
  city,
  state,
  zipCode,
  maxCapacity,
  amenities = [],
  description,
  totalAmount,
  serviceFee,
  taxAmount,
  finalAmount,
  hostName,
  appName = "SpaceOnGo",
}: BookingConfirmationEmailProps) {
  // Helper function to convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const timeDisplay = startTime && endTime 
    ? `${formatTimeTo12Hour(startTime)} - ${formatTimeTo12Hour(endTime)}` 
    : null

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#18181b", padding: "32px 24px", textAlign: "center" as const }}>
        <h1 style={{ color: "#ffffff", margin: 0, fontSize: "28px", fontWeight: "700" }}>{appName}</h1>
      </div>

      {/* Success Banner */}
      <div style={{ backgroundColor: "#10b981", padding: "20px 24px", textAlign: "center" as const }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>&#10003;</div>
        <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "600" }}>Booking Confirmed!</h2>
        <p style={{ color: "#d1fae5", margin: "8px 0 0", fontSize: "14px" }}>
          Thank you for your booking, {guestName}
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: "32px 24px", backgroundColor: "#ffffff" }}>
        {/* Confirmation Number */}
        <div style={{ 
          backgroundColor: "#f4f4f5", 
          padding: "16px", 
          borderRadius: "8px", 
          marginBottom: "24px",
          textAlign: "center" as const 
        }}>
          <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 4px", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
            Confirmation Number
          </p>
          <p style={{ color: "#18181b", fontSize: "24px", fontWeight: "700", margin: 0, fontFamily: "monospace" }}>
            {confirmationNumber}
          </p>
        </div>

        {/* Space Details */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#18181b", fontSize: "18px", fontWeight: "600", margin: "0 0 16px", borderBottom: "2px solid #e4e4e7", paddingBottom: "8px" }}>
            Space Details
          </h3>
          
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 0", color: "#71717a", fontSize: "14px", width: "140px" }}>Space Name</td>
                <td style={{ padding: "8px 0", color: "#18181b", fontSize: "14px", fontWeight: "500" }}>{spaceName}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", color: "#71717a", fontSize: "14px" }}>Type</td>
                <td style={{ padding: "8px 0", color: "#18181b", fontSize: "14px", fontWeight: "500" }}>{spaceType}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", color: "#71717a", fontSize: "14px" }}>Host</td>
                <td style={{ padding: "8px 0", color: "#18181b", fontSize: "14px", fontWeight: "500" }}>{hostName}</td>
              </tr>
              {maxCapacity && (
                <tr>
                  <td style={{ padding: "8px 0", color: "#71717a", fontSize: "14px" }}>Max Capacity</td>
                  <td style={{ padding: "8px 0", color: "#18181b", fontSize: "14px", fontWeight: "500" }}>{maxCapacity} guests</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Booking Details */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#18181b", fontSize: "18px", fontWeight: "600", margin: "0 0 16px", borderBottom: "2px solid #e4e4e7", paddingBottom: "8px" }}>
            Booking Details
          </h3>
          
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <tbody>
              <tr>
                <td style={{ padding: "8px 0", color: "#71717a", fontSize: "14px", width: "140px" }}>Date</td>
                <td style={{ padding: "8px 0", color: "#18181b", fontSize: "14px", fontWeight: "500" }}>{bookingDate}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", color: "#71717a", fontSize: "14px" }}>Duration</td>
                <td style={{ padding: "8px 0", color: "#18181b", fontSize: "14px", fontWeight: "500" }}>{bookingDuration}</td>
              </tr>
              {timeDisplay && (
                <tr>
                  <td style={{ padding: "8px 0", color: "#71717a", fontSize: "14px" }}>Time</td>
                  <td style={{ padding: "8px 0", color: "#18181b", fontSize: "14px", fontWeight: "500" }}>{timeDisplay}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Location */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#18181b", fontSize: "18px", fontWeight: "600", margin: "0 0 16px", borderBottom: "2px solid #e4e4e7", paddingBottom: "8px" }}>
            Location
          </h3>
          <p style={{ color: "#18181b", fontSize: "14px", margin: "0", lineHeight: "1.6" }}>
            {address}<br />
            {city}, {state} {zipCode}
          </p>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ color: "#18181b", fontSize: "18px", fontWeight: "600", margin: "0 0 16px", borderBottom: "2px solid #e4e4e7", paddingBottom: "8px" }}>
              Amenities Included
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
              {amenities.slice(0, 10).map((amenity, index) => (
                <span 
                  key={index}
                  style={{ 
                    backgroundColor: "#f4f4f5", 
                    color: "#52525b", 
                    padding: "6px 12px", 
                    borderRadius: "16px", 
                    fontSize: "12px",
                    display: "inline-block"
                  }}
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 10 && (
                <span style={{ color: "#71717a", fontSize: "12px", padding: "6px 0" }}>
                  +{amenities.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Space Description */}
        {description && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ color: "#18181b", fontSize: "18px", fontWeight: "600", margin: "0 0 16px", borderBottom: "2px solid #e4e4e7", paddingBottom: "8px" }}>
              About This Space
            </h3>
            <p style={{ color: "#52525b", fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              {description.length > 300 ? `${description.substring(0, 300)}...` : description}
            </p>
          </div>
        )}

        {/* Payment Summary */}
        <div style={{ 
          backgroundColor: "#f4f4f5", 
          padding: "20px", 
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          <h3 style={{ color: "#18181b", fontSize: "18px", fontWeight: "600", margin: "0 0 16px" }}>
            Payment Summary
          </h3>
          
          <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 0", color: "#52525b", fontSize: "14px" }}>Subtotal</td>
                <td style={{ padding: "6px 0", color: "#18181b", fontSize: "14px", textAlign: "right" as const }}>${totalAmount}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", color: "#52525b", fontSize: "14px" }}>Service Fee</td>
                <td style={{ padding: "6px 0", color: "#18181b", fontSize: "14px", textAlign: "right" as const }}>${serviceFee}</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", color: "#52525b", fontSize: "14px" }}>Tax</td>
                <td style={{ padding: "6px 0", color: "#18181b", fontSize: "14px", textAlign: "right" as const }}>${taxAmount}</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ borderTop: "1px solid #e4e4e7", paddingTop: "12px", marginTop: "8px" }}></td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", color: "#18181b", fontSize: "16px", fontWeight: "600" }}>Total Paid</td>
                <td style={{ padding: "6px 0", color: "#10b981", fontSize: "18px", fontWeight: "700", textAlign: "right" as const }}>${finalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: "center" as const, marginBottom: "24px" }}>
          <a
            href="https://www.spaceongo.com/dashboard/bookings"
            style={{
              backgroundColor: "#18181b",
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            View My Bookings
          </a>
        </div>

        {/* Help Section */}
        <div style={{ 
          backgroundColor: "#fef3c7", 
          padding: "16px", 
          borderRadius: "8px",
          borderLeft: "4px solid #f59e0b"
        }}>
          <p style={{ color: "#92400e", fontSize: "14px", margin: 0, fontWeight: "500" }}>
            Need help with your booking?
          </p>
          <p style={{ color: "#a16207", fontSize: "13px", margin: "8px 0 0", lineHeight: "1.5" }}>
            Contact us at <a href="mailto:info@spaceongo.com" style={{ color: "#92400e" }}>info@spaceongo.com</a> or visit our Help Center.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: "#f4f4f5", padding: "24px", textAlign: "center" as const }}>
        <p style={{ color: "#71717a", fontSize: "12px", margin: "0 0 8px" }}>
          &copy; {new Date().getFullYear()} {appName}. All rights reserved.
        </p>
        <p style={{ color: "#a1a1aa", fontSize: "11px", margin: 0 }}>
          This email was sent because you made a booking on {appName}.
        </p>
      </div>
    </div>
  )
}
