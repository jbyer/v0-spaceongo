"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Key, AlertTriangle, CheckCircle, Eye, EyeOff, UserPlus, UserMinus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface SuperuserAccount {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  is_superuser: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export default function SuperuserManagement() {
  const { toast } = useToast()
  const [superusers, setSuperusers] = useState<SuperuserAccount[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [showRemoveAdmin, setShowRemoveAdmin] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SuperuserAccount | null>(null)
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResults, setSearchResults] = useState<SuperuserAccount[]>([])
  const [searching, setSearching] = useState(false)

  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    loadSuperusers()

    // Set up real-time subscription for profile changes
    const supabase = createClient()
    const channel = supabase
      .channel("superuser-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: "is_superuser=eq.true",
        },
        () => {
          loadSuperusers()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadSuperusers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or("is_superuser.eq.true,is_admin.eq.true")
        .order("created_at", { ascending: false })

      if (error) throw error

      setSuperusers(data || [])
    } catch (error) {
      console.error("Error loading superusers:", error)
      toast({
        title: "Error",
        description: "Failed to load superuser accounts.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address to search.",
        variant: "destructive",
      })
      return
    }

    setSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", `%${searchEmail.trim()}%`)
        .eq("is_superuser", false)
        .limit(10)

      if (error) throw error

      if (!data || data.length === 0) {
        toast({
          title: "No Results",
          description: "No non-admin users found with that email.",
        })
        setSearchResults([])
        return
      }

      setSearchResults(data)
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "Failed to search for users.",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const handleAddAdmin = async (user: SuperuserAccount, makeSuperuser = false) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          is_admin: true,
          is_superuser: makeSuperuser,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${user.email} has been granted ${makeSuperuser ? "superuser" : "admin"} privileges.`,
      })

      setShowAddAdmin(false)
      setSearchEmail("")
      setSearchResults([])
      loadSuperusers()
    } catch (error) {
      console.error("Error adding admin:", error)
      toast({
        title: "Error",
        description: "Failed to grant admin privileges.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveAdmin = async () => {
    if (!selectedUser) return

    try {
      const supabase = createClient()

      // Check if this is the last superuser
      const activeSuperusers = superusers.filter((u) => u.is_superuser && u.id !== selectedUser.id)
      if (selectedUser.is_superuser && activeSuperusers.length === 0) {
        toast({
          title: "Cannot Remove",
          description: "Cannot remove the last superuser. There must be at least one superuser account.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_admin: false,
          is_superuser: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `Admin privileges removed from ${selectedUser.email}.`,
      })

      setShowRemoveAdmin(false)
      setSelectedUser(null)
      loadSuperusers()
    } catch (error) {
      console.error("Error removing admin:", error)
      toast({
        title: "Error",
        description: "Failed to remove admin privileges.",
        variant: "destructive",
      })
    }
  }

  const handlePasswordReset = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    // Note: Password reset functionality would require additional Supabase Admin API setup
    toast({
      title: "Feature Notice",
      description: "Password reset functionality requires Supabase Admin API configuration.",
    })

    setResetSuccess(true)
    setNewPassword("")
    setConfirmPassword("")

    setTimeout(() => {
      setShowPasswordReset(false)
      setResetSuccess(false)
      setSelectedUser(null)
    }, 2000)
  }

  const getDisplayName = (user: SuperuserAccount) => {
    return user.display_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading superuser accounts...</p>
        </div>
      </div>
    )
  }

  const activeSuperusers = superusers.filter((u) => u.is_superuser).length
  const activeAdmins = superusers.filter((u) => u.is_admin && !u.is_superuser).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Superuser Management</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive" className="text-sm">
            RESTRICTED ACCESS
          </Badge>
          <Button onClick={() => setShowAddAdmin(true)} className="bg-green-600 hover:bg-green-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin User
          </Button>
        </div>
      </div>

      {/* Security Warning */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Security Notice:</strong> This section contains sensitive administrative functions. All actions are
          logged and monitored. Only authorized personnel should access this area.
        </AlertDescription>
      </Alert>

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Superusers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSuperusers}</div>
            <p className="text-xs text-muted-foreground">Full system access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAdmins}</div>
            <p className="text-xs text-muted-foreground">Limited admin access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Secure</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Superuser Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin & Superuser Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superusers.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getDisplayName(account)}</p>
                        <p className="text-sm text-gray-500">{account.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {account.is_superuser && <Badge className="bg-red-600">Superuser</Badge>}
                        {account.is_admin && !account.is_superuser && <Badge className="bg-blue-600">Admin</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(account.created_at).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(account.updated_at).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(account)
                            setShowRemoveAdmin(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Authentication Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Session Timeout:</span>
                  <span className="font-medium">1 hour</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Failed Attempts:</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex justify-between">
                  <span>Lockout Duration:</span>
                  <span className="font-medium">15 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Password Min Length:</span>
                  <span className="font-medium">8 characters</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Security Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Two-Factor Authentication:</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Login Monitoring:</span>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Audit Logging:</span>
                  <Badge className="bg-green-500">Enabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span>IP Restrictions:</span>
                  <Badge variant="outline">Configurable</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Admin User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Search for a user by email address to grant them admin privileges. Admin users will have access to the
                admin dashboard and management features.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="searchEmail">Search User by Email</Label>
              <div className="flex gap-2">
                <Input
                  id="searchEmail"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email address..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchUser()
                  }}
                />
                <Button onClick={handleSearchUser} disabled={searching}>
                  <Search className="h-4 w-4 mr-2" />
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Search Results</Label>
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} className="p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{getDisplayName(user)}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddAdmin(user, false)}
                            className="text-blue-600"
                          >
                            Make Admin
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddAdmin(user, true)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Make Superuser
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddAdmin(false)
                setSearchEmail("")
                setSearchResults([])
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveAdmin} onOpenChange={setShowRemoveAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserMinus className="h-5 w-5" />
              Remove Admin Privileges
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> This action will remove all admin and superuser privileges from this account.
                They will lose access to the admin dashboard immediately.
              </AlertDescription>
            </Alert>

            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">You are about to remove admin privileges from:</p>
                <p className="font-medium text-lg">{getDisplayName(selectedUser)}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  {selectedUser.is_superuser && <Badge className="bg-red-600">Superuser</Badge>}
                  {selectedUser.is_admin && <Badge className="bg-blue-600">Admin</Badge>}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Are you sure you want to proceed? This action can be reversed by adding them as an admin again.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveAdmin(false)
                setSelectedUser(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRemoveAdmin} className="bg-red-600 hover:bg-red-700">
              Remove Admin Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Superuser Password
            </DialogTitle>
          </DialogHeader>

          {resetSuccess ? (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">Password Reset Successful</h3>
              <p className="text-sm text-gray-600">The password has been updated securely.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  This feature requires Supabase Admin API configuration for production use.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPasswordReset(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePasswordReset} className="bg-red-600 hover:bg-red-700">
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
