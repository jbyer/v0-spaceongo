"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Bar, BarChart, Pie, PieChart, Cell } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingUp, Download, Calendar, Building } from "lucide-react"

// Mock financial data
const platformFinancials = {
  totalRevenue: 2847392,
  monthlyRevenue: 284739,
  averageBookingValue: 187,
  totalCommission: 427109, // 15% commission
  monthlyGrowth: 12.5,
  topRevenueMonth: "June 2024",
}

const monthlyRevenueData = [
  { month: "Jan", revenue: 185000, commission: 27750, bookings: 987 },
  { month: "Feb", revenue: 198000, commission: 29700, bookings: 1056 },
  { month: "Mar", revenue: 225000, commission: 33750, bookings: 1203 },
  { month: "Apr", revenue: 242000, commission: 36300, bookings: 1294 },
  { month: "May", revenue: 268000, commission: 40200, bookings: 1432 },
  { month: "Jun", revenue: 284000, commission: 42600, bookings: 1518 },
]

const spaceRevenueData = [
  {
    id: 1,
    name: "Manhattan Executive Center",
    owner: "John Smith",
    totalRevenue: 45200,
    commission: 6780,
    bookings: 89,
    avgRate: 300,
  },
  {
    id: 2,
    name: "Brooklyn Creative Studio",
    owner: "Sarah Johnson",
    totalRevenue: 38900,
    commission: 5835,
    bookings: 76,
    avgRate: 200,
  },
  {
    id: 3,
    name: "Queens Conference Hub",
    owner: "Mike Davis",
    totalRevenue: 32100,
    commission: 4815,
    bookings: 64,
    avgRate: 150,
  },
  {
    id: 4,
    name: "Bronx Co-working Space",
    owner: "Emily Wilson",
    totalRevenue: 28700,
    commission: 4305,
    bookings: 58,
    avgRate: 100,
  },
  {
    id: 5,
    name: "Staten Island Event Venue",
    owner: "David Brown",
    totalRevenue: 25400,
    commission: 3810,
    bookings: 52,
    avgRate: 250,
  },
  {
    id: 6,
    name: "Midtown Meeting Room",
    owner: "Lisa Garcia",
    totalRevenue: 22800,
    commission: 3420,
    bookings: 48,
    avgRate: 180,
  },
  {
    id: 7,
    name: "SoHo Art Studio",
    owner: "Robert Taylor",
    totalRevenue: 21500,
    commission: 3225,
    bookings: 45,
    avgRate: 220,
  },
  {
    id: 8,
    name: "Financial District Office",
    owner: "Jennifer Lee",
    totalRevenue: 19200,
    commission: 2880,
    bookings: 42,
    avgRate: 280,
  },
]

const revenueByTypeData = [
  { name: "Office", value: 35, revenue: 995000, color: "#8884d8" },
  { name: "Studio", value: 25, revenue: 711000, color: "#82ca9d" },
  { name: "Conference Room", value: 20, revenue: 569000, color: "#ffc658" },
  { name: "Co-working", value: 15, revenue: 427000, color: "#ff7300" },
  { name: "Event Space", value: 5, revenue: 142000, color: "#00ff00" },
]

export default function AdminFinancialReports() {
  const [timeRange, setTimeRange] = useState("6months")
  const [reportType, setReportType] = useState("overview")

  const exportReport = () => {
    // Mock export functionality
    console.log("Exporting financial report...")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(platformFinancials.totalRevenue / 1000000).toFixed(2)}M</div>
            <p className="text-xs text-muted-foreground">All-time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(platformFinancials.monthlyRevenue / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{platformFinancials.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(platformFinancials.totalCommission / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">15% commission rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${platformFinancials.averageBookingValue}</div>
            <p className="text-xs text-muted-foreground">Per booking average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue ($)",
                  color: "hsl(var(--chart-1))",
                },
                commission: {
                  label: "Commission ($)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                  <Line type="monotone" dataKey="commission" stroke="var(--color-commission)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Space Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                office: { label: "Office", color: "#8884d8" },
                studio: { label: "Studio", color: "#82ca9d" },
                conference: { label: "Conference Room", color: "#ffc658" },
                coworking: { label: "Co-working", color: "#ff7300" },
                event: { label: "Event Space", color: "#00ff00" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {revenueByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Space Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Space Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Space Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Platform Commission</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Avg Rate</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spaceRevenueData.map((space, index) => (
                  <TableRow key={space.id}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "outline"}>#{index + 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{space.name}</TableCell>
                    <TableCell>{space.owner}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">${space.totalRevenue.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${space.commission.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>{space.bookings}</TableCell>
                    <TableCell>${space.avgRate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min((space.totalRevenue / 50000) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{Math.round((space.totalRevenue / 50000) * 100)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: "Total Revenue",
                color: "hsl(var(--chart-1))",
              },
              bookings: {
                label: "Bookings",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
