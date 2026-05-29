import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"
  const type = searchParams.get("type")



  if (code) {
    const cookieStore = request.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value)
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      },
    )

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=oauth_callback_error&message=${encodeURIComponent(error.message)}`,
      )
    }

    if (!sessionData?.user) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_user_data`)
    }

    const user = sessionData.user
    const userMetadata = user.user_metadata
    const provider = user.app_metadata?.provider
    const isOAuthUser = ["google", "facebook", "linkedin_oidc"].includes(provider || "")

    if (isOAuthUser && userMetadata) {
      try {
        // Check if profile already has name and picture
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name, profile_image_url, is_host")
          .eq("id", user.id)
          .single()

        // Only update if profile fields are empty
        const shouldUpdate =
          !existingProfile?.first_name || !existingProfile?.last_name || !existingProfile?.profile_image_url

        if (shouldUpdate) {
          const firstName =
            userMetadata.given_name ||
            userMetadata.first_name ||
            userMetadata.name?.split(" ")[0] ||
            userMetadata.full_name?.split(" ")[0] ||
            ""
          const lastName =
            userMetadata.family_name ||
            userMetadata.last_name ||
            userMetadata.name?.split(" ").slice(1).join(" ") ||
            userMetadata.full_name?.split(" ").slice(1).join(" ") ||
            ""
          const profilePicture = userMetadata.avatar_url || userMetadata.picture || userMetadata.picture_url || ""
          const displayName = userMetadata.full_name || userMetadata.name || `${firstName} ${lastName}`.trim()

          // Update profile with OAuth data
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              first_name: firstName || existingProfile?.first_name,
              last_name: lastName || existingProfile?.last_name,
              display_name: displayName || existingProfile?.first_name,
              profile_image_url: profilePicture || existingProfile?.profile_image_url,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)

          if (updateError) {
            return NextResponse.redirect(
              `${origin}/dashboard/profile?error=profile_sync_failed&message=${encodeURIComponent(updateError.message)}`,
            )
          }
        }

        if (type === "signup") {
          // For new signups, always check if role needs to be set
          if (!existingProfile || existingProfile.is_host === null) {
            return NextResponse.redirect(`${origin}/auth/select-role?next=${encodeURIComponent(next)}`)
          }
        }

        // Handle host signup from List Space page - automatically set as host
        if (type === "host_signup") {
          // Use service role client to bypass RLS for profile update
          const { createClient: createServiceClient } = await import("@supabase/supabase-js")
          const supabaseAdmin = createServiceClient(
            process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
          )
          
          console.log("[v0] Setting host role for user:", user.id)
          
          const { error: hostUpdateError } = await supabaseAdmin
            .from("profiles")
            .update({
              is_host: true,
              user_role: "host",
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
          
          if (hostUpdateError) {
            console.error("[v0] Failed to set host role:", hostUpdateError)
          } else {
            console.log("[v0] Successfully set is_host=true for user:", user.id)
          }
          
          // Redirect to add space page for hosts
          return NextResponse.redirect(`${origin}/dashboard/add-space?welcome=true`)
        }
      } catch (syncError) {
        return NextResponse.redirect(`${origin}/dashboard/profile?warning=profile_sync_incomplete`)
      }
    }

    // Check if we need to redirect to onboarding for new users
    if (type === "signup") {
      return NextResponse.redirect(`${origin}/dashboard/profile?welcome=true`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_code_missing`)
}
