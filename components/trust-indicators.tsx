"use client"

import { Shield, Clock, CheckCircle, Award, MessageCircle, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TrustIndicatorsProps {
  verified?: boolean
  superhost?: boolean
  instantBooking?: boolean
  responseRate?: number
  responseTime?: string
  totalBookings?: number
  memberSince?: string
}

export function TrustIndicators({
  verified = true,
  superhost = false,
  instantBooking = true,
  responseRate = 98,
  responseTime = "within an hour",
  totalBookings = 156,
  memberSince = "2022",
}: TrustIndicatorsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-500" />
          Trust & Safety
        </h3>

        <div className="space-y-4">
          {/* Verification Badges */}
          <div className="flex flex-wrap gap-2">
            {verified && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified Host
              </Badge>
            )}
            {superhost && (
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                <Award className="w-3 h-3 mr-1" />
                Superhost
              </Badge>
            )}
            {instantBooking && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                <Clock className="w-3 h-3 mr-1" />
                Instant Book
              </Badge>
            )}
          </div>

          {/* Host Statistics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">{responseRate}% response rate</div>
                <div className="text-gray-600">Responds {responseTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">{totalBookings} bookings</div>
                <div className="text-gray-600">Member since {memberSince}</div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="pt-3 border-t">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Identity verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Secure payment processing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
