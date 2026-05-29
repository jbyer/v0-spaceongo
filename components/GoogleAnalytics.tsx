"use client"

import Script from "next/script"
import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface GoogleAnalyticsProps {
  gaId: string
}

function GoogleAnalyticsTracker({ gaId, consentGiven }: { gaId: string; consentGiven: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views on route change
  useEffect(() => {
    if (!consentGiven || !gaId) return

    const url = pathname + searchParams.toString()

    // Send pageview to Google Analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", gaId, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, gaId, consentGiven])

  return null
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const [consentGiven, setConsentGiven] = useState(false)

  // Check for analytics consent from localStorage
  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (consent === "all" || consent === "analytics") {
      setConsentGiven(true)
    }

    // Listen for consent changes
    const handleConsentChange = () => {
      const newConsent = localStorage.getItem("cookie-consent")
      setConsentGiven(newConsent === "all" || newConsent === "analytics")
    }

    window.addEventListener("cookie-consent-updated", handleConsentChange)
    return () => window.removeEventListener("cookie-consent-updated", handleConsentChange)
  }, [])

  // Only load GA scripts if consent is given
  if (!consentGiven || !gaId) {
    return null
  }

  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <GoogleAnalyticsTracker gaId={gaId} consentGiven={consentGiven} />
      </Suspense>
    </>
  )
}
