"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { checkSpaceAvailability } from "@/app/actions/bookings"
import { useRouter } from 'next/navigation'
import { useCurrency } from "@/contexts/currency-context"

type BookingCardProps = {
  spaceId: string
  pricePerHour: number | null
  pricePerDay: number | null
  onCheckAvailability?: (data: {
    rentalType: "hourly" | "daily"
    startDate: Date
    endDate?: Date
    startTime?: string
    endTime?: string
  }) => void
  onBookNow?: (data: {
    rentalType: "hourly" | "daily"
    startDate: Date
    endDate?: Date
    startTime?: string
    endTime?: string
  }) => void
}

const formatTimeTo12Hour = (time24: string): string => {
  const [hourStr, minute] = time24.split(":")
  const hour = parseInt(hourStr, 10)
  
  if (hour === 0) {
    return `12:${minute} AM`
  } else if (hour < 12) {
    return `${hour}:${minute} AM`
  } else if (hour === 12) {
    return `12:${minute} PM`
  } else {
    return `${hour - 12}:${minute} PM`
  }
}

export function BookingCard({ spaceId, pricePerHour, pricePerDay, onCheckAvailability, onBookNow }: BookingCardProps) {
  const router = useRouter()
  const { formatPrice } = useCurrency()
  const [rentalType, setRentalType] = useState<"hourly" | "daily">("daily")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState<string>("09:00")
  const [endTime, setEndTime] = useState<string>("17:00")
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityResult, setAvailabilityResult] = useState<{
    checked: boolean
    available: boolean
    reason: string | null
  } | null>(null)

  // Determine available rental types
  const hasHourly = pricePerHour !== null && pricePerHour > 0
  const hasDaily = pricePerDay !== null && pricePerDay > 0
  const hasBoth = hasHourly && hasDaily

  // Set default rental type based on available options
  useEffect(() => {
    if (!hasBoth) {
      if (hasHourly) setRentalType("hourly")
      if (hasDaily) setRentalType("daily")
    }
  }, [hasHourly, hasDaily, hasBoth])

  useEffect(() => {
    setAvailabilityResult(null)
  }, [rentalType, startDate, endDate, startTime, endTime])

  const handleCheckAvailability = async () => {
    if (!startDate) return

    setIsCheckingAvailability(true)
    setAvailabilityResult(null)

    try {
      const result = await checkSpaceAvailability({
        spaceId,
        rentalType,
        startDate: startDate.toISOString(),
        ...(rentalType === "daily" && endDate ? { endDate: endDate.toISOString() } : {}),
        ...(rentalType === "hourly" ? { startTime, endTime } : {}),
      })

      setAvailabilityResult({
        checked: true,
        available: result.available,
        reason: result.reason,
      })

      // Call the optional callback
      onCheckAvailability?.({
        rentalType,
        startDate,
        ...(rentalType === "daily" && endDate ? { endDate } : {}),
        ...(rentalType === "hourly" ? { startTime, endTime } : {}),
      })
    } catch (error) {
      console.error("[v0] Error checking availability:", error)
      setAvailabilityResult({
        checked: true,
        available: false,
        reason: "An error occurred while checking availability",
      })
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const handleBookNow = () => {
    onBookNow?.({
      rentalType,
      startDate: startDate!,
      ...(rentalType === "daily" && endDate ? { endDate } : {}),
      ...(rentalType === "hourly" ? { startTime, endTime } : {}),
    })
  }

  const isFormValid = () => {
    if (!startDate) return false
    if (rentalType === "daily" && !endDate) return false
    if (rentalType === "hourly" && (!startTime || !endTime)) return false
    return true
  }

  // Generate time options (24-hour format)
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })

  return (
    <Card className="sticky top-6">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold">{formatPrice(rentalType === "hourly" ? pricePerHour : pricePerDay)}</div>
          <div className="text-muted-foreground">per {rentalType === "hourly" ? "hour" : "day"}</div>
        </div>

        <div className="space-y-4">
          {hasBoth && (
            <div className="space-y-2">
              <Label>Rental Term</Label>
              <Select value={rentalType} onValueChange={(value: "hourly" | "daily") => setRentalType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasHourly && <SelectItem value="hourly">Hourly</SelectItem>}
                  {hasDaily && <SelectItem value="daily">Daily</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          {rentalType === "daily" && (
            <div className="space-y-2">
              <Label>Select Dates</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd") : "Check-in"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd") : "Check-out"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < (startDate || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {rentalType === "hourly" && (
            <>
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue>
                        {formatTimeTo12Hour(startTime)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTimeTo12Hour(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue>
                        {formatTimeTo12Hour(endTime)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTimeTo12Hour(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {availabilityResult && (
            <div
              className={cn(
                "p-3 rounded-lg border flex items-start gap-2",
                availabilityResult.available
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800",
              )}
            >
              {availabilityResult.available ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {availabilityResult.available ? (
                  <p className="font-medium">Space is available!</p>
                ) : (
                  <>
                    <p className="font-medium">Not available</p>
                    {availabilityResult.reason && <p className="mt-1">{availabilityResult.reason}</p>}
                  </>
                )}
              </div>
            </div>
          )}

          {!availabilityResult?.checked ? (
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleCheckAvailability}
              disabled={!isFormValid() || isCheckingAvailability}
            >
              {isCheckingAvailability ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Availability...
                </>
              ) : (
                "Check Availability"
              )}
            </Button>
          ) : availabilityResult.available ? (
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleBookNow}>
              Book Now
            </Button>
          ) : (
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleCheckAvailability}
              disabled={!isFormValid() || isCheckingAvailability}
            >
              Check Different Dates
            </Button>
          )}

          {!availabilityResult?.available && (
            <div className="text-center text-sm text-muted-foreground">You won't be charged yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
