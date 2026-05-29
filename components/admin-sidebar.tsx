"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Building,
  BarChart3,
  Users,
  LogOut,
  Shield,
  Star,
  Grid,
  FileText,
  Clock,
  Plus,
  MessageSquare,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "pending", label: "Pending Approvals", icon: Clock, href: "/admin/pending" },
    { id: "spaces", label: "Space Management", icon: Building },
    { id: "add-space", label: "Add Space", icon: Plus, href: "/admin/add-space" },
    { id: "featured", label: "Featured Settings", icon: Star },
    { id: "all-spaces", label: "All Spaces Settings", icon: Grid },
    { id: "blog", label: "Blog Management", icon: FileText },
    { id: "chatbot", label: "Chatbot Settings", icon: MessageSquare },
    { id: "reports", label: "Financial Reports", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "security", label: "Security Dashboard", icon: Shield },
    { id: "superuser", label: "Superuser Management", icon: Shield },
  ]

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()

      // Sign out from Supabase - this clears all session data and auth tokens
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Show success message
      toast({
        title: "Signed out successfully",
        description: "You have been securely signed out of the admin dashboard.",
      })

      // Small delay to allow toast to be visible before redirect
      setTimeout(() => {
        // Redirect to homepage
        router.push("/")
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("[v0] Error signing out:", error)

      // Show error message to user
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      })

      setIsSigningOut(false)
    }
  }

  return (
    <aside className="w-64 bg-rose-50 border-r border-rose-200 flex flex-col">
      <div className="p-6 border-b border-rose-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
        </div>
        <Badge variant="destructive" className="text-xs">
          SUPERUSER ACCESS
        </Badge>
        <p className="text-sm text-gray-600 mt-2">System Administrator</p>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                if (item.href) {
                  router.push(item.href)
                } else {
                  onTabChange(item.id)
                }
              }}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-rose-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-100"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>
    </aside>
  )
}
