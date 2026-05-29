"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"

interface TimeRange {
  start: string
  end: string
}

interface UnavailableSlot {
  id: string
  date: string
  timeRanges: TimeRange[]
  isRecurring: boolean
  recurringDay?: number
}

interface UnavailableScheduleReadoutProps {
  unavailableSlots: UnavailableSlot[]
}

export default function UnavailableScheduleReadout({ unavailableSlots }: UnavailableScheduleReadoutProps) {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  // Helper to format time (HH:MM to h:MM AM/PM)
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number)
    const ampm = hours >= 12 ? "pm" : "am"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${String(minutes).padStart(2, "0")}${ampm}`
  }

  // Helper to parse date string
  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  // Group slots by recurring vs specific dates
  const recurringSlots = unavailableSlots.filter((slot) => slot.isRecurring)
  const specificDateSlots = unavailableSlots.filter((slot) => !slot.isRecurring)

  // Sort specific dates
  const sortedSpecificDates = [...specificDateSlots].sort((a, b) => {
    const dateA = parseDateString(a.date)
    const dateB = parseDateString(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  if (unavailableSlots.length === 0) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-gray-600 text-center">No unavailable periods configured</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Unavailable Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recurring Unavailability */}
        {recurringSlots.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Recurring Unavailability</h4>
            <div className="space-y-3">
              {recurringSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      Every {daysOfWeek[slot.recurringDay || 0]}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {slot.timeRanges.map((range, index) => (
                        <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(range.start)} to {formatTime(range.end)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specific Date Unavailability */}
        {sortedSpecificDates.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Specific Unavailability</h4>
            <div className="space-y-3">
              {sortedSpecificDates.map((slot) => {
                const date = parseDateString(slot.date)
                const dayName = daysOfWeek[date.getDay()]
                const dateString = date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })

                return (
                  <div
                    key={slot.id}
                    className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {dayName} — {dateString}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {slot.timeRanges.map((range, index) => (
                          <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(range.start)} to {formatTime(range.end)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
