interface WelcomeEmailProps {
  firstName: string
  appName?: string
  dashboardUrl: string
}

export function WelcomeEmail({ firstName, appName = "SpaceOnGo", dashboardUrl }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#18181b", padding: "24px", textAlign: "center" as const }}>
        <h1 style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{appName}</h1>
      </div>

      <div style={{ padding: "32px 24px", backgroundColor: "#ffffff" }}>
        <h2 style={{ color: "#18181b", marginTop: 0 }}>🎉 Your account is verified!</h2>

        <p style={{ color: "#52525b", lineHeight: "1.6" }}>
          Hi {firstName}, congratulations! Your email has been verified and your {appName} account is now fully
          activated.
        </p>

        <h3 style={{ color: "#18181b", marginTop: "24px" }}>What's next?</h3>

        <ul style={{ color: "#52525b", lineHeight: "1.8", paddingLeft: "20px" }}>
          <li>
            <strong>Complete your profile</strong> - Add a photo and bio to help others connect with you
          </li>
          <li>
            <strong>Browse spaces</strong> - Discover unique venues for your next event or activity
          </li>
          <li>
            <strong>List your space</strong> - Have a space to share? Start earning by listing it
          </li>
        </ul>

        <div style={{ textAlign: "center" as const, margin: "32px 0" }}>
          <a
            href={dashboardUrl}
            style={{
              backgroundColor: "#18181b",
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: "600",
            }}
          >
            Go to Dashboard
          </a>
        </div>

        <p style={{ color: "#71717a", fontSize: "14px" }}>
          Need help getting started? Check out our{" "}
          <a href={`${dashboardUrl.replace("/dashboard", "")}/help`} style={{ color: "#3b82f6" }}>
            Help Center
          </a>{" "}
          or reply to this email.
        </p>
      </div>

      <div style={{ backgroundColor: "#f4f4f5", padding: "24px", textAlign: "center" as const }}>
        <p style={{ color: "#71717a", fontSize: "12px", margin: 0 }}>
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </p>
      </div>
    </div>
  )
}
