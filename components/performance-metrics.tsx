"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Bar, BarChart, Pie, PieChart, Cell } from "recharts"
import { TrendingUp, Star, DollarSign } from "lucide-react"

const performanceData = [
  { month: "Jan", occupancy: 65, adr: 145, revpar: 94 },
  { month: "Feb", occupancy: 58, adr: 140, revpar: 81 },
  { month: "Mar", occupancy: 82, adr: 155, revpar: 127 },
  { month: "Apr", occupancy: 75, adr: 150, revpar: 113 },
  { month: "May", occupancy: 78, adr: 160, revpar: 125 },
  { month: "Jun", occupancy: 85, adr: 165, revpar: 140 },
]

const spaceTypeData = [
  { name: "Office", value: 45, color: "#8884d8" },
  { name: "Studio", value: 30, color: "#82ca9d" },
  { name: "Conference", value: 25, color: "#ffc658" },
]

const reviewData = [
  { month: "Jan", rating: 4.6, reviews: 12 },
  { month: "Feb", rating: 4.5, reviews: 8 },
  { month: "Mar", rating: 4.8, reviews: 24 },
  { month: "Apr", rating: 4.7, reviews: 18 },
  { month: "May", rating: 4.8, reviews: 22 },
  { month: "Jun", rating: 4.9, reviews: 16 },
]

export default function PerformanceMetrics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Last 6 months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="12months">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$152</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.1%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Per Space</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$118</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.3%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">Based on 100 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy & Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                occupancy: {
                  label: "Occupancy Rate (%)",
                  color: "hsl(var(--chart-1))",
                },
                revpar: {
                  label: "Revenue per Space ($)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="occupancy" stroke="var(--color-occupancy)" strokeWidth={2} />
                  <Line type="monotone" dataKey="revpar" stroke="var(--color-revpar)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by Space Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                office: {
                  label: "Office",
                  color: "#8884d8",
                },
                studio: {
                  label: "Studio",
                  color: "#82ca9d",
                },
                conference: {
                  label: "Conference",
                  color: "#ffc658",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spaceTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {spaceTypeData.map((entry, index) => (
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

      {/* Reviews and Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              rating: {
                label: "Average Rating",
                color: "hsl(var(--chart-1))",
              },
              reviews: {
                label: "Number of Reviews",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="reviews" fill="var(--color-reviews)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
