interface VerificationEmailProps {
  firstName: string
  verificationUrl: string
  appName?: string
}

export function VerificationEmail({ firstName, verificationUrl, appName = "SpaceOnGo" }: VerificationEmailProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#18181b", padding: "24px", textAlign: "center" as const }}>
        <h1 style={{ color: "#ffffff", margin: 0, fontSize: "24px" }}>{appName}</h1>
      </div>

      <div style={{ padding: "32px 24px", backgroundColor: "#ffffff" }}>
        <h2 style={{ color: "#18181b", marginTop: 0 }}>Welcome, {firstName}!</h2>

        <p style={{ color: "#52525b", lineHeight: "1.6" }}>
          Thank you for signing up for {appName}. To complete your registration and start discovering amazing spaces,
          please verify your email address by clicking the button below.
        </p>

        <div style={{ textAlign: "center" as const, margin: "32px 0" }}>
          <a
            href={verificationUrl}
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
            Verify Email Address
          </a>
        </div>

        <p style={{ color: "#71717a", fontSize: "14px", lineHeight: "1.6" }}>
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style={{ color: "#3b82f6", fontSize: "14px", wordBreak: "break-all" as const }}>{verificationUrl}</p>

        <hr style={{ border: "none", borderTop: "1px solid #e4e4e7", margin: "24px 0" }} />

        <p style={{ color: "#a1a1aa", fontSize: "12px", lineHeight: "1.5" }}>
          This link will expire in 24 hours. If you didn't create an account with {appName}, you can safely ignore this
          email.
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
