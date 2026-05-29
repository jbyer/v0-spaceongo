interface NewSpaceNotificationEmailProps {
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
  listingDate: string
  spaceId: string
  appName?: string
}

export function NewSpaceNotificationEmail({
  spaceName,
  spaceType,
  hostName,
  address,
  city,
  state,
  zipCode,
  capacity,
  hourlyRate,
  dailyRate,
  weeklyRate,
  monthlyRate,
  description,
  amenities = [],
  listingDate,
  spaceId,
  appName = "SpaceOnGo",
}: NewSpaceNotificationEmailProps) {
  const pricingDisplay = [
    hourlyRate && `$${hourlyRate}/hour`,
    dailyRate && `$${dailyRate}/day`,
    weeklyRate && `$${weeklyRate}/week`,
    monthlyRate && `$${monthlyRate}/month`,
  ]
    .filter(Boolean)
    .join(" • ")

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#18181b", padding: "32px 24px", textAlign: "center" as const }}>
        <h1 style={{ color: "#ffffff", margin: 0, fontSize: "28px", fontWeight: "700" }}>{appName} Admin</h1>
      </div>

      {/* New Listing Banner */}
      <div style={{ backgroundColor: "#3b82f6", padding: "20px 24px", textAlign: "center" as const }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🆕</div>
        <h2 style={{ color: "#ffffff", margin: 0, fontSize: "24px", fontWeight: "600" }}>New Space Listed</h2>
        <p style={{ color: "#dbeafe", margin: "8px 0 0", fontSize: "14px" }}>Awaiting your review and approval</p>
      </div>

      {/* Main Content */}
      <div style={{ padding: "32px 24px", backgroundColor: "#ffffff" }}>
        {/* Space Information Card */}
        <div style={{ backgroundColor: "#f4f4f5", borderRadius: "8px", padding: "20px", marginBottom: "24px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: "600", color: "#000" }}>{spaceName}</h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            <strong>Space Type:</strong> {spaceType}
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#666", marginBottom: "12px" }}>
            <strong>Host:</strong> {hostName}
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
            <strong>Listing Date:</strong> {listingDate}
          </p>
        </div>

        {/* Location Section */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#000" }}>Location</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: "1.6" }}>
            {address}
            <br />
            {city}, {state} {zipCode}
          </p>
        </div>

        {/* Capacity Section */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#000" }}>Capacity</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>Maximum {capacity} guests</p>
        </div>

        {/* Pricing Section */}
        {pricingDisplay && (
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#000" }}>Pricing</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>{pricingDisplay}</p>
          </div>
        )}

        {/* Description Section */}
        {description && (
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#000" }}>Description</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: "1.6" }}>{description.substring(0, 300)}...</p>
          </div>
        )}

        {/* Amenities Section */}
        {amenities.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#000" }}>Amenities</h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#666" }}>
              {amenities.slice(0, 5).map((amenity, index) => (
                <li key={index} style={{ marginBottom: "4px" }}>
                  {amenity}
                </li>
              ))}
              {amenities.length > 5 && <li>... and {amenities.length - 5} more</li>}
            </ul>
          </div>
        )}

        {/* CTA Section */}
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#000", fontWeight: "600" }}>
            Action Required:
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || "https://www.spaceongo.com"}/admin/pending-approvals?spaceId=${spaceId}`}
            style={{
              display: "inline-block",
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Review & Approve Listing
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: "#f4f4f5", padding: "24px", textAlign: "center" as const }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
          This is an automated notification from {appName}. Please do not reply to this email.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#999" }}>
          Space ID: {spaceId}
        </p>
      </div>
    </div>
  )
}
