"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { formatDateShort } from "@/lib/format-date"
import { useCurrency } from "@/contexts/currency-context"

interface PaymentSummaryProps {
  booking: {
    space: {
      title: string
      location: string
      images: string[]
    }
    start_date: string
    end_date: string
    guests: number
    total_amount: number
  }
  fees?: {
    serviceFee: number
    cleaningFee: number
    taxes: number
  }
}

export function PaymentSummary({ booking, fees }: PaymentSummaryProps) {
  const { formatPrice } = useCurrency()
  const startDate = new Date(booking.start_date)
  const endDate = new Date(booking.end_date)
  const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  const subtotal = booking.total_amount
  const serviceFee = fees?.serviceFee || subtotal * 0.1
  const cleaningFee = fees?.cleaningFee || 25
  const taxes = fees?.taxes || subtotal * 0.08
  const total = subtotal + serviceFee + cleaningFee + taxes

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Space Info */}
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
            {booking.space.images[0] && (
              <img
                src={booking.space.images[0] || "/placeholder.svg"}
                alt={booking.space.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{booking.space.title}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
              <MapPin className="h-3 w-3" />
              <span>{booking.space.location}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Booking Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Check-in</span>
            </div>
            <span>{formatDateShort(booking.start_date)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Check-out</span>
            </div>
            <span>{formatDateShort(booking.end_date)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Duration</span>
            </div>
            <span>
              {nights} {nights === 1 ? "night" : "nights"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>Guests</span>
            </div>
            <span>{booking.guests}</span>
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {formatPrice(subtotal / nights)} × {nights} nights
            </span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Service fee</span>
            <span>{formatPrice(serviceFee)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Cleaning fee</span>
            <span>{formatPrice(cleaningFee)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Taxes</span>
            <span>{formatPrice(taxes)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            {"You'll be charged "}{formatPrice(total)}{" today. Your booking will be confirmed immediately after payment."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
