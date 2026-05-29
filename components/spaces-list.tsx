"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Star, MapPin, Users, Eye, Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useCurrency } from "@/contexts/currency-context"

const spaces = [
  {
    id: 1,
    name: "Modern Downtown Office",
    address: "123 Business Ave, New York, NY",
    image: "/placeholder.svg?height=200&width=300&text=Modern+Office",
    type: "Office",
    capacity: 25,
    rating: 4.8,
    reviews: 42,
    totalBookings: 28,
    occupancyRate: 85,
    avgDailyRate: 150,
    totalRevenue: 8400,
    status: "Active",
  },
  {
    id: 2,
    name: "Creative Studio Space",
    address: "456 Art District, Los Angeles, CA",
    image: "/placeholder.svg?height=200&width=300&text=Creative+Studio",
    type: "Studio",
    capacity: 15,
    rating: 4.9,
    reviews: 28,
    totalBookings: 22,
    occupancyRate: 78,
    avgDailyRate: 200,
    totalRevenue: 6600,
    status: "Active",
  },
  {
    id: 3,
    name: "Executive Conference Room",
    address: "789 Corporate Blvd, Chicago, IL",
    image: "/placeholder.svg?height=200&width=300&text=Conference+Room",
    type: "Conference Room",
    capacity: 12,
    rating: 4.7,
    reviews: 35,
    totalBookings: 35,
    occupancyRate: 92,
    avgDailyRate: 100,
    totalRevenue: 5250,
    status: "Active",
  },
]

export default function SpacesList() {
  const { formatPrice } = useCurrency()
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Spaces</h1>
        <Button>Add New Space</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input placeholder="Search spaces..." className="sm:max-w-xs" />
        <Select>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Space Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="conference">Conference Room</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <Image
                src={space.image || "/placeholder.svg"}
                alt={space.name}
                width={300}
                height={200}
                className="w-full h-48 object-cover"
              />
              <Badge className="absolute top-2 left-2 bg-white text-gray-900">{space.type}</Badge>
              <Badge className={`absolute top-2 right-2 ${space.status === "Active" ? "bg-green-500" : "bg-gray-500"}`}>
                {space.status}
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{space.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {space.address}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{space.rating}</span>
                    <span className="text-gray-500">({space.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{space.capacity} people</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Bookings</div>
                    <div className="font-semibold">{space.totalBookings}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Occupancy Rate</div>
                    <div className="font-semibold">{space.occupancyRate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Daily Rate</div>
                    <div className="font-semibold">{formatPrice(space.avgDailyRate)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Revenue</div>
                    <div className="font-semibold text-green-600">{formatPrice(space.totalRevenue)}</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem>Archive</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
