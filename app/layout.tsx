import type React from "react"
import type { Metadata } from "next"
import { Roboto } from "next/font/google"
import "./globals.css"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { Analytics } from "@vercel/analytics/react"
import { Chatbot } from "@/components/chatbot"
import { CurrencyProvider } from "@/contexts/currency-context"

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  title: "SpaceOnGo | Find & Book Flexible Coworking, Office, and Event Spaces",
  description:
    "SpaceOnGo is the ultimate platform for finding flexible space solutions that suit your needs. Whether you need an office, a conference room, a studio, a storage space, or an event space, you can browse and book from a wide range of options on SpaceOnGo. No lease, no hassle, and no upfront costs. Find your perfect space!",
  generator: "SpaceOnGo",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${roboto.style.fontFamily};
  --font-sans: ${roboto.variable};
}
        `}</style>
      </head>
      <body className={`${roboto.className} antialiased`}>
        <CurrencyProvider>
          {children}
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
          <CookieConsentBanner />
          <Chatbot />
          <Analytics />
        </CurrencyProvider>
      </body>
    </html>
  )
}
