"use client"

import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Building,
  DollarSign,
  Calendar,
  LogOut,
  Plus,
  User,
  Heart,
  BookOpen,
  MessageCircle,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface DashboardSidebarProps {
  activeTab: string
  onTabChange?: (tab: string) => void
}

export default function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const [firstName, setFirstName] = useState<string | null>(null)
  const [isHost, setIsHost] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const profileChannelRef = useRef<RealtimeChannel | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    const supabase = supabaseRef.current

    async function loadUserProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          if (userError.message.includes("Too Many")) {
            console.log("[v0] Rate limited, will retry on next auth state change")
            setIsLoading(false)
            return
          }
          
          // If user doesn't exist in the JWT, try to refresh the session
          if (userError.message.includes("does not exist")) {
            console.log("[v0] User session invalid, attempting to refresh...")
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error("[v0] Session refresh failed:", refreshError)
              setIsLoading(false)
              return
            }
            // Retry getting the user after refresh
            const { data: { user: refreshedUser }, error: retryError } = await supabase.auth.getUser()
            if (retryError || !refreshedUser) {
              console.error("[v0] Error getting user after refresh:", retryError)
              setIsLoading(false)
              return
            }
            // Continue with the refreshed user
          } else {
            console.error("[v0] Error getting user:", userError)
            setIsLoading(false)
            return
          }
        }

        if (!user) {
          setIsLoading(false)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, is_host")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("[v0] Error fetching profile:", profileError)
        } else if (profile) {
          setFirstName(profile.first_name)
          setIsHost(profile.is_host || false)
          console.log("[v0] User role - isHost:", profile.is_host)
        }

        setIsLoading(false)

        // Only set up realtime subscription if it hasn't been set up yet
        if (!profileChannelRef.current && user?.id) {
          try {
            profileChannelRef.current = supabase
              .channel(`profile-changes-${user.id}`)
              .on(
                "postgres_changes",
                {
                  event: "UPDATE",
                  schema: "public",
                  table: "profiles",
                  filter: `id=eq.${user.id}`,
                },
                (payload) => {
                  if (payload.new && "first_name" in payload.new) {
                    setFirstName(payload.new.first_name as string | null)
                  }
                  if (payload.new && "is_host" in payload.new) {
                    setIsHost(payload.new.is_host as boolean)
                  }
                },
              )
              .subscribe()
          } catch (subscriptionError) {
            console.error("[v0] Error setting up realtime subscription:", subscriptionError)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading user profile:", error)
        setIsLoading(false)
      }
    }

    loadUserProfile()

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        hasLoadedRef.current = false
        loadUserProfile()
      } else if (event === "SIGNED_OUT") {
        setFirstName(null)
        setIsHost(false)
        setIsLoading(false)
      }
    })

    return () => {
      authSubscription?.unsubscribe()
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current)
        profileChannelRef.current = null
      }
    }
  }, [])

  const allMenuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: User },
    { id: "spaces", label: "My Spaces", icon: Building, hostOnly: true },
    { id: "add-space", label: "Add Space", icon: Plus, hostOnly: true },
    { id: "bookings", label: "Bookings", icon: BookOpen },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "financials", label: "Financials", icon: DollarSign, hostOnly: true },
    { id: "calendar", label: "Calendar", icon: Calendar, hostOnly: true },
  ]

  const menuItems = allMenuItems.filter((item) => !item.hostOnly || isHost)

  const handleSignOut = async () => {
    const supabase = supabaseRef.current
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const sidebarBgClass = isHost
    ? "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-200" // Blue gradient for hosts
    : "bg-blue-50 border-blue-100" // Cool blue for renters

  const headerBorderClass = isHost ? "border-blue-200" : "border-blue-100"

  const footerBorderClass = isHost ? "border-blue-200" : "border-blue-100"

  return (
    <aside className={`w-64 border-r flex flex-col transition-colors duration-500 ${sidebarBgClass}`}>
      <div className={`p-6 border-b ${headerBorderClass}`}>
        <h2 className="text-xl font-semibold text-gray-800">{isHost ? "Host Dashboard" : "My Dashboard"}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isLoading ? (
            <span className="inline-block w-32 h-4 bg-gray-200 rounded animate-pulse" />
          ) : firstName ? (
            `Welcome back, ${firstName}!`
          ) : (
            "Welcome back!"
          )}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                if (item.id === "overview") {
                  window.location.href = "/dashboard"
                } else if (item.id === "profile") {
                  window.location.href = "/dashboard/profile"
                } else if (item.id === "add-space") {
                  window.location.href = "/dashboard/add-space?fresh=true"
                } else if (item.id === "favorites") {
                  window.location.href = "/dashboard/favorites"
                } else if (item.id === "spaces") {
                  window.location.href = "/dashboard/my-spaces"
                } else if (item.id === "bookings") {
                  window.location.href = "/dashboard/bookings"
                } else if (item.id === "messages") {
                  window.location.href = "/dashboard/messages"
                } else {
                  onTabChange?.(item.id)
                }
              }}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <div className={`p-4 border-t ${footerBorderClass}`}>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
