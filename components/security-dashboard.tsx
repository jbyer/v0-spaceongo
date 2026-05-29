"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, AlertTriangle, Eye, Clock, MapPin } from "lucide-react"

// Mock security data
const securityLogs = [
  {
    id: 1,
    timestamp: "2024-06-15T14:30:00Z",
    event: "Successful Login",
    user: "jason@example.com",
    ip: "192.168.1.100",
    location: "New York, NY",
    userAgent: "Chrome 125.0.0.0",
    risk: "Low",
  },
  {
    id: 2,
    timestamp: "2024-06-15T14:25:00Z",
    event: "Failed Login Attempt",
    user: "unknown@example.com",
    ip: "203.0.113.45",
    location: "Unknown",
    userAgent: "Bot/1.0",
    risk: "High",
  },
  {
    id: 3,
    timestamp: "2024-06-15T13:45:00Z",
    event: "Password Reset",
    user: "jason@example.com",
    ip: "192.168.1.100",
    location: "New York, NY",
    userAgent: "Chrome 125.0.0.0",
    risk: "Medium",
  },
]

const securityMetrics = {
  totalLogins: 1247,
  failedAttempts: 23,
  blockedIPs: 5,
  activeThreats: 0,
  lastSecurityScan: "2024-06-15T12:00:00Z",
}

export default function SecurityDashboard() {
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    if (realTimeMonitoring) {
      const interval = setInterval(() => {
        setLastUpdate(new Date())
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [realTimeMonitoring])

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return <Badge className="bg-green-500">Low</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>
      case "high":
        return <Badge className="bg-red-500">High</Badge>
      default:
        return <Badge variant="outline">{risk}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${realTimeMonitoring ? "bg-green-500" : "bg-gray-400"}`}></div>
          <span className="text-sm text-gray-600">{realTimeMonitoring ? "Live Monitoring" : "Monitoring Paused"}</span>
          <Button variant="outline" size="sm" onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}>
            {realTimeMonitoring ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      {/* Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.totalLogins.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{securityMetrics.failedAttempts}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityMetrics.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">Currently blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{securityMetrics.activeThreats}</div>
            <p className="text-xs text-muted-foreground">No threats detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {securityMetrics.activeThreats === 0 ? (
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>System Secure:</strong> No active security threats detected. All systems operating normally.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Alert:</strong> {securityMetrics.activeThreats} active threat(s) detected. Immediate
            attention required.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Security Events</CardTitle>
            <Badge variant="outline" className="text-xs">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        log.event.includes("Failed")
                          ? "text-red-600"
                          : log.event.includes("Successful")
                            ? "text-green-600"
                            : "text-blue-600"
                      }`}
                    >
                      {log.event}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.user}</p>
                      <p className="text-xs text-gray-500">{log.ip}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {log.location}
                    </div>
                  </TableCell>
                  <TableCell>{getRiskBadge(log.risk)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Password Policy</span>
                <Badge className="bg-green-500">Enforced</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Two-Factor Authentication</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Session Timeout</span>
                <Badge className="bg-green-500">1 Hour</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Failed Login Protection</span>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Audit Logging</span>
                <Badge className="bg-green-500">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Authentication Service</span>
                <Badge className="bg-green-500">Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Connection</span>
                <Badge className="bg-green-500">Healthy</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Security Monitoring</span>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Backup Status</span>
                <Badge className="bg-green-500">Current</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Security Scan</span>
                <Badge variant="outline">{new Date(securityMetrics.lastSecurityScan).toLocaleDateString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
