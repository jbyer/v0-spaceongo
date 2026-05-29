"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import RegistrationPopup from "./registration-popup"
import LoginPopup from "./login-popup"
import { createClient } from "@/lib/supabase/client"
import { CurrencySelector } from "@/components/currency-selector"

interface UserProfile {
  profile_image_url: string | null
  first_name: string | null
  last_name: string | null
}

export function SiteHeader() {
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")

  useEffect(() => {
    const checkAdminAuth = async () => {
      // Only check if we're on an admin route
      if (!isAdminRoute) {
        setIsAdminAuthenticated(false)
        return
      }

      try {
        const supabase = createClient()
        if (!supabase) {
          setIsAdminAuthenticated(false)
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsAdminAuthenticated(false)
          return
        }

        // Check if user has admin/superuser privileges
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, is_superuser")
          .eq("id", user.id)
          .single()

        setIsAdminAuthenticated(profile?.is_superuser || profile?.is_admin || false)
      } catch (error) {
        console.error("Error checking admin authentication:", error)
        setIsAdminAuthenticated(false)
      }
    }

    checkAdminAuth()
  }, [isAdminRoute, pathname])

  useEffect(() => {
    const supabase = createClient()

    if (!supabase) {
      setIsUserAuthenticated(false)
      return
    }

    const checkUserAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setIsUserAuthenticated(!!user)

        if (user) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("profile_image_url, first_name, last_name")
            .eq("id", user.id)
            .maybeSingle()

          if (error) {
            // Profile fetch failed silently
          } else if (profile) {
            setUserProfile(profile)
          }
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error("Error checking user authentication:", error)
        setIsUserAuthenticated(false)
        setUserProfile(null)
      }
    }

    checkUserAuth()

    // Subscribe to auth state changes for real-time updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsUserAuthenticated(!!session?.user)

      if (event === "SIGNED_OUT") {
        setUserProfile(null)
      } else if (event === "SIGNED_IN" && session?.user) {
        // Refetch profile on sign in
        checkUserAuth()
      }
    })

    const profileChannel = supabase
      .channel("profile-avatar-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (payload.new) {
            const newProfile = payload.new as UserProfile
            setUserProfile({
              profile_image_url: newProfile.profile_image_url,
              first_name: newProfile.first_name,
              last_name: newProfile.last_name,
            })
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(profileChannel)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      if (!supabase) return

      await supabase.auth.signOut()
      setUserProfile(null) // Clear profile immediately on logout
      window.location.href = "/"
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const getUserInitials = () => {
    if (!userProfile) return "U"
    const firstInitial = userProfile.first_name?.charAt(0)?.toUpperCase() || ""
    const lastInitial = userProfile.last_name?.charAt(0)?.toUpperCase() || ""
    return firstInitial + lastInitial || "U"
  }

  const showUserIcon = !(isAdminRoute && isAdminAuthenticated)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="sr-only">SpaceOnGo.com</span>
          <Image
            src="/images/spaceongo-logo.png"
            alt="SpaceOnGo - Find Your Perfect Space"
            width={300}
            height={94}
            className="h-10 w-auto md:h-10 md:w-auto"
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/find-space">FIND SPACE</Link>
          </Button>
          {/*<Button variant="ghost" asChild>
            <Link href="/all-spaces">ALL SPACES</Link>
          </Button>*/}
          <Button variant="ghost" asChild>
            <Link href="/blog">BLOG</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/about">ABOUT</Link>
          </Button>
          <Button 
            variant="outline" 
            asChild
            className={pathname === "/list-space" ? "border-blue-600 bg-blue-50 text-blue-700" : ""}
          >
            <Link href="/list-space" aria-current={pathname === "/list-space" ? "page" : undefined}>
              LIST YOUR SPACE
            </Link>
          </Button>
          {!isUserAuthenticated && (
            <Button onClick={() => setShowRegistrationPopup(true)}>REGISTER</Button>
          )}

          {showUserIcon && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 bg-transparent">
                  <Avatar className="h-8 w-8">
                    {isUserAuthenticated && userProfile?.profile_image_url ? (
                      <AvatarImage src={userProfile.profile_image_url || "/placeholder.svg"} alt="User Profile" />
                    ) : (
                      !isUserAuthenticated && <UserIcon className="h-5 w-5" />
                    )}
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {isUserAuthenticated ? getUserInitials() : <UserIcon className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[60]">
                {isUserAuthenticated ? (
                  <DropdownMenuItem onClick={handleLogout}>LOG OUT</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowLoginPopup(true)}>LOG IN</DropdownMenuItem>
                )}
                {isUserAuthenticated && (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">DASHBOARD</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/help">HELP</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <CurrencySelector />
        </nav>
        <div className="md:hidden flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[60]">
              <DropdownMenuItem asChild>
                <Link href="/find-space">FIND SPACE</Link>
              </DropdownMenuItem>
              {/*<DropdownMenuItem asChild>
                <Link href="/all-spaces">All SPACES</Link>
              </DropdownMenuItem>*/}
              <DropdownMenuItem asChild>
                <Link href="/blog">BLOG</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/about">ABOUT</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className={pathname === "/list-space" ? "bg-blue-50 text-blue-700" : ""}>
                <Link href="/list-space" aria-current={pathname === "/list-space" ? "page" : undefined}>
                  LIST YOUR SPACE
                </Link>
              </DropdownMenuItem>
              {!isUserAuthenticated && (
                <DropdownMenuItem onClick={() => setShowRegistrationPopup(true)}>REGISTER</DropdownMenuItem>
              )}
              {isUserAuthenticated ? (
                <DropdownMenuItem onClick={handleLogout}>LOG OUT</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setShowLoginPopup(true)}>LOG IN</DropdownMenuItem>
              )}
              {isUserAuthenticated && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">DASHBOARD</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/help">HELP</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CurrencySelector />
        </div>
      </div>
      <RegistrationPopup
        isOpen={showRegistrationPopup}
        onClose={() => setShowRegistrationPopup(false)}
        onSuccess={() => {
          // Optionally open login popup after successful registration
          setShowRegistrationPopup(false)
        }}
      />

      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </header>
  )
}

export default SiteHeader
