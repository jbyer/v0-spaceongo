import { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spacesongo.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/checkout/",
          "/payment/",
          "/auth/error",
          "/auth/reset-password",
          "/auth/verify-email",
          "/auth/verification-success",
          "/auth/sign-up-success",
          "/auth/select-role",
          "/api/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/checkout/",
          "/payment/",
          "/auth/error",
          "/auth/reset-password",
          "/auth/verify-email",
          "/auth/verification-success",
          "/auth/sign-up-success",
          "/auth/select-role",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
