"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, X, Plus, AlertCircle } from 'lucide-react'
import { cn } from "@/lib/utils"

interface TimeRange {
  start: string
  end: string
}

interface UnavailableSlot {
  id: string
  date: string
  timeRanges: TimeRange[]
  isRecurring: boolean
  recurringDay?: number // 0-6 for Sunday-Saturday
}

interface AvailabilityCalendarProps {
  unavailableSlots: UnavailableSlot[]
  onSlotsChange: (slots: UnavailableSlot[]) => void
}

// Utility function to convert 24-hour time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const hours12 = hours % 12 || 12 // Convert 0 to 12 for midnight
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
}

const convertTo24Hour = (hours12: number, minutes: number, period: string): string => {
  let hours24 = hours12
  if (period === "PM" && hours12 !== 12) {
    hours24 = hours12 + 12
  } else if (period === "AM" && hours12 === 12) {
    hours24 = 0
  }
  return `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

const parseTime = (time24: string) => {
  const [hours24, minutes] = time24.split(":").map(Number)
  const period = hours24 >= 12 ? "PM" : "AM"
  const hours12 = hours24 % 12 || 12
  return { hours: hours12, minutes, period }
}

export function validateAvailabilityCalendar(unavailableSlots: UnavailableSlot[]): string | null {
  // Get condensed date ranges
  const getCondensedDateRanges = () => {
    // Get all non-recurring slots sorted by date
    const dateSlots = unavailableSlots
      .filter((slot) => !slot.isRecurring)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (dateSlots.length === 0) return []

    const ranges: Array<{ slots: typeof dateSlots; startDate: string; endDate: string }> = []
    let currentRange = [dateSlots[0]]

    for (let i = 1; i < dateSlots.length; i++) {
      const currentDate = new Date(dateSlots[i].date)
      const prevDate = new Date(dateSlots[i - 1].date)
      const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

      // If consecutive (1 day apart), add to current range
      if (diffDays === 1) {
        currentRange.push(dateSlots[i])
      } else {
        // Start a new range
        ranges.push({
          slots: currentRange,
          startDate: currentRange[0].date,
          endDate: currentRange[currentRange.length - 1].date,
        })
        currentRange = [dateSlots[i]]
      }
    }

    // Add the last range
    ranges.push({
      slots: currentRange,
      startDate: currentRange[0].date,
      endDate: currentRange[currentRange.length - 1].date,
    })

    return ranges
  }

  const dateRanges = getCondensedDateRanges()
  if (dateRanges.length < 2) return null

  // Check for overlaps
  for (let i = 0; i < dateRanges.length; i++) {
    for (let j = i + 1; j < dateRanges.length; j++) {
      const range1Dates = dateRanges[i].slots.map((s) => s.date)
      const range2Dates = dateRanges[j].slots.map((s) => s.date)

      // Find common dates
      const commonDates = range1Dates.filter((date) => range2Dates.includes(date))

      if (commonDates.length > 0) {
        return `Your unavailable date ranges overlap. Please remove or adjust the overlapping dates before continuing.`
      }
    }
  }

  return null
}

export default function AvailabilityCalendar({ unavailableSlots, onSlotsChange }: AvailabilityCalendarProps) {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([{ start: "09:00", end: "17:00" }])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Initialize form fields from unavailableSlots only on mount (for edit mode loading)
  // This should NOT re-run when slots are added, to avoid re-selecting cleared days
  useEffect(() => {
    if (unavailableSlots.length > 0) {
      // Find first recurring slot to populate selectedDays and time ranges
      const recurringSlots = unavailableSlots.filter((slot) => slot.isRecurring)
      if (recurringSlots.length > 0) {
        setIsRecurring(true)
        const days = recurringSlots.map((slot) => slot.recurringDay ?? 0)
        setSelectedDays([...new Set(days)])
        
        // Use time ranges from first recurring slot
        if (recurringSlots[0].timeRanges.length > 0) {
          setTimeRanges(recurringSlots[0].timeRanges)
        }
      }

      // Find first non-recurring slot to populate date range
      const dateRangeSlots = unavailableSlots.filter((slot) => !slot.isRecurring)
      if (dateRangeSlots.length > 0) {
        setIsRecurring(false)
        
        // Find min and max dates
        const dates = dateRangeSlots.map((slot) => slot.date)
        const minDate = dates.sort()[0]
        const maxDate = dates.sort()[dates.length - 1]
        
        setStartDate(minDate)
        setEndDate(maxDate)
        
        // Use time ranges from first date range slot
        if (dateRangeSlots[0].timeRanges.length > 0) {
          setTimeRanges(dateRangeSlots[0].timeRanges)
        }
      }
    } else {
      console.log("[v0] No unavailableSlots provided to AvailabilityCalendar")
    }
  }, []) // Empty dependency - only run on mount for initial load

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (number | null)[] = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  // Helper function to parse date string in local time and format for display
  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Helper function to format a date for display, ensuring it shows the correct local date
  const formatDateForDisplay = (dateStr: string): string => {
    const date = parseDateString(dateStr)
    return date.toLocaleDateString()
  }

  // Generate all dates between start and end date (inclusive)
  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = []
    
    // Parse date strings (YYYY-MM-DD) into local Date objects, not UTC
    const [startYear, startMonth, startDay] = start.split('-').map(Number)
    const [endYear, endMonth, endDay] = end.split('-').map(Number)
    
    const startDateTime = new Date(startYear, startMonth - 1, startDay)
    const endDateTime = new Date(endYear, endMonth - 1, endDay)
    
    for (let d = new Date(startDateTime); d <= endDateTime; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(d.getFullYear(), d.getMonth(), d.getDate()))
    }
    
    return dates
  }

  const isDateUnavailable = (dateStr: string) => {
    return unavailableSlots.some((slot) => slot.date === dateStr && !slot.isRecurring)
  }

  const isDayRecurringUnavailable = (dayOfWeek: number) => {
    return unavailableSlots.some((slot) => slot.isRecurring && slot.recurringDay === dayOfWeek)
  }

  // Get all unavailable slots for a specific date (including recurring days)
  const getUnavailableSlotsForDate = (dateStr: string) => {
    const date = parseDateString(dateStr)
    const dayOfWeek = date.getDay()
    
    const slots = unavailableSlots.filter((slot) => {
      if (slot.isRecurring && slot.recurringDay === dayOfWeek) return true
      if (!slot.isRecurring && slot.date === dateStr) return true
      return false
    })
    
    return slots
  }

  // Calculate the total blocked minutes for a date
  const calculateBlockedMinutes = (slots: UnavailableSlot[]) => {
    let totalMinutes = 0
    
    slots.forEach((slot) => {
      slot.timeRanges.forEach((range) => {
        const [startHour, startMin] = range.start.split(":").map(Number)
        const [endHour, endMin] = range.end.split(":").map(Number)
        const startTotalMin = startHour * 60 + startMin
        const endTotalMin = endHour * 60 + endMin
        totalMinutes += endTotalMin - startTotalMin
      })
    })
    
    return totalMinutes
  }

  // Calculate the earliest start time from all time ranges as a percentage of the day
  const getBlockStartOffset = (slots: UnavailableSlot[]) => {
    if (slots.length === 0) return 0
    
    let earliestMinutes = 24 * 60 // Start at end of day
    
    slots.forEach((slot) => {
      slot.timeRanges.forEach((range) => {
        const [startHour, startMin] = range.start.split(":").map(Number)
        const startTotalMin = startHour * 60 + startMin
        if (startTotalMin < earliestMinutes) {
          earliestMinutes = startTotalMin
        }
      })
    })
    
    const totalMinutesInDay = 24 * 60
    return (earliestMinutes / totalMinutesInDay) * 100
  }

  // Calculate block height as percentage (0-100% of a day)
  const getBlockHeight = (slots: UnavailableSlot[]) => {
    const blockedMinutes = calculateBlockedMinutes(slots)
    const totalMinutesInDay = 24 * 60
    return Math.min(100, (blockedMinutes / totalMinutesInDay) * 100)
  }

  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { start: "09:00", end: "17:00" }])
  }

  const removeTimeRange = (index: number) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((_, i) => i !== index))
    }
  }

  const updateTimeRange = (index: number, field: "start" | "end", value: string) => {
    const updated = [...timeRanges]
    updated[index][field] = value
    setTimeRanges(updated)
  }

  const addUnavailableSlot = () => {
    if (isRecurring && selectedDays.length > 0) {
      // Create a slot for each selected recurring day with full-day blocking by default
      const newSlots: UnavailableSlot[] = selectedDays.map((dayOfWeekIndex, index) => ({
        id: `recurring-${Date.now()}-${index}`,
        date: "",
        timeRanges: [{ start: "00:00", end: "23:59" }], // Full day blocking for recurring days
        isRecurring: true,
        // recurringDay is 0-6: 0=Sunday, 1=Monday, 2=Tuesday, etc. (matches Date.getDay())
        recurringDay: dayOfWeekIndex,
      }))
      onSlotsChange([...unavailableSlots, ...newSlots])
      // Clear the selected days to unhighlight the buttons
      setSelectedDays([])
    } else if (!isRecurring && startDate && endDate) {
      // Generate all dates in the range and create slots
      const datesInRange = generateDateRange(startDate, endDate)
      const newSlots: UnavailableSlot[] = datesInRange.map((date, index) => ({
        id: `date-${Date.now()}-${index}`,
        date: date,
        timeRanges: [...timeRanges],
        isRecurring: false,
      }))
      onSlotsChange([...unavailableSlots, ...newSlots])
      setStartDate("")
      setEndDate("")
    }
    setTimeRanges([{ start: "09:00", end: "17:00" }])
  }

  const removeUnavailableSlot = (id: string) => {
    onSlotsChange(unavailableSlots.filter((slot) => slot.id !== id))
  }

  // Detect and condense consecutive date range slots
  const getCondensedDateRanges = () => {
    // Get all non-recurring slots sorted by date
    const dateSlots = unavailableSlots
      .filter((slot) => !slot.isRecurring)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (dateSlots.length === 0) return []

    const ranges: Array<{ slots: typeof dateSlots; startDate: string; endDate: string }> = []
    let currentRange = [dateSlots[0]]

    for (let i = 1; i < dateSlots.length; i++) {
      const currentDate = new Date(dateSlots[i].date)
      const prevDate = new Date(dateSlots[i - 1].date)
      const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

      // If consecutive (1 day apart), add to current range
      if (diffDays === 1) {
        currentRange.push(dateSlots[i])
      } else {
        // Start a new range
        ranges.push({
          slots: currentRange,
          startDate: currentRange[0].date,
          endDate: currentRange[currentRange.length - 1].date,
        })
        currentRange = [dateSlots[i]]
      }
    }

    // Add the last range
    ranges.push({
      slots: currentRange,
      startDate: currentRange[0].date,
      endDate: currentRange[currentRange.length - 1].date,
    })

    return ranges
  }

  // Format date range for display (e.g., "Jun 1 - Jun 30")
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseDateString(startDate)
    const end = parseDateString(endDate)
    const startMonth = start.toLocaleDateString("en-US", { month: "short" })
    const endMonth = end.toLocaleDateString("en-US", { month: "short" })
    const startDay = start.getDate()
    const endDay = end.getDate()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
    }
  }

  // Detect overlapping date ranges in unavailable slots
  const getDateRangeOverlaps = () => {
    const dateRanges = getCondensedDateRanges()
    if (dateRanges.length < 2) return []

    const overlaps: Array<{ range1: string; range2: string; overlapDates: string[] }> = []

    for (let i = 0; i < dateRanges.length; i++) {
      for (let j = i + 1; j < dateRanges.length; j++) {
        const range1Dates = dateRanges[i].slots.map((s) => s.date)
        const range2Dates = dateRanges[j].slots.map((s) => s.date)

        // Find common dates
        const commonDates = range1Dates.filter((date) => range2Dates.includes(date))

        if (commonDates.length > 0) {
          overlaps.push({
            range1: formatDateRange(dateRanges[i].startDate, dateRanges[i].endDate),
            range2: formatDateRange(dateRanges[j].startDate, dateRanges[j].endDate),
            overlapDates: commonDates,
          })
        }
      }
    }

    return overlaps
  }

  const handleDayOfWeekClick = (dayIndex: number) => {
    setIsRecurring(true)
    setStartDate("")
    setEndDate("")
    
    // Toggle the day in the selection array
    setSelectedDays((prev) => {
      const newSelection = prev.includes(dayIndex) 
        ? prev.filter((d) => d !== dayIndex) 
        : [...prev, dayIndex]
      return newSelection
    })
  }

  const clearDateRange = () => {
    setStartDate("")
    setEndDate("")
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Unavailable Calendar
          </CardTitle>
          <CardDescription>
            Mark specific dates or recurring days when your space will be unavailable for booking. Click a date in the calendar below, select a range, or choose recurring days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="mb-2 block">Start Date</Label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setIsRecurring(false)
                    setSelectedDays([])
                    setStartDate(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-2 block">End Date</Label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  disabled={!startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-900">
                  {formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  Clear Range
                </Button>
              </div>
            )}

            {/* Overlap Error Message */}
            {(() => {
              const overlaps = getDateRangeOverlaps()
              return overlaps.length > 0 ? (
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 pt-0.5">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Overlapping unavailable dates</p>
                      <div className="text-sm text-red-700 mt-1 space-y-1">
                        {overlaps.map((overlap, idx) => (
                          <div key={idx}>
                            {overlap.range1} and {overlap.range2} share {overlap.overlapDates.length} day
                            {overlap.overlapDates.length > 1 ? "s" : ""}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-red-600 mt-2">
                        Please remove or adjust one of the overlapping date ranges before continuing.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null
            })()}
          </div>

          {/* Recurring Days Selection */}
          <div>
            <Label className="mb-3 block">Or select recurring unavailable days</Label>
            
            {selectedDays.length > 0 && (
              <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-900">
                  {selectedDays.length} day{selectedDays.length !== 1 ? "s" : ""} selected: {selectedDays.map(d => daysOfWeek[d].slice(0, 3)).join(", ")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDays([])}
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                >
                  Clear Selection
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysOfWeek.map((day, index) => {
                const isRecurringUnavailable = isDayRecurringUnavailable(index)
                const isSelected = selectedDays.includes(index)

                return (
                  <button
                    key={day}
                    onClick={() => handleDayOfWeekClick(index)}
                    className={cn(
                      "px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium",
                      isSelected && "border-blue-500 bg-blue-50 ring-2 ring-blue-300",
                      isRecurringUnavailable && !isSelected && "bg-orange-100 border-orange-300 text-orange-700",
                      !isSelected &&
                        !isRecurringUnavailable &&
                        "border-gray-200 hover:bg-gray-50 hover:border-blue-400",
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Ranges */}
          {((startDate && endDate) || selectedDays.length > 0) && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Unavailable Time Ranges
                </Label>
                <Button variant="outline" size="sm" onClick={addTimeRange}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time Range
                </Button>
              </div>

              <div className="space-y-3">
                {timeRanges.map((range, index) => {
                  const startTime = parseTime(range.start)
                  const endTime = parseTime(range.end)
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1">Start Time</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={startTime.hours}
                              onChange={(e) => {
                                const newTime = convertTo24Hour(
                                  Number.parseInt(e.target.value),
                                  startTime.minutes,
                                  startTime.period
                                )
                                updateTimeRange(index, "start", newTime)
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              {[...Array(12)].map((_, i) => {
                                const hour = i + 1
                                return (
                                  <option key={hour} value={hour}>
                                    {hour}
                                  </option>
                                )
                              })}
                            </select>
                            <select
                              value={startTime.minutes}
                              onChange={(e) => {
                                const newTime = convertTo24Hour(
                                  startTime.hours,
                                  Number.parseInt(e.target.value),
                                  startTime.period
                                )
                                updateTimeRange(index, "start", newTime)
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value={0}>00</option>
                              <option value={15}>15</option>
                              <option value={30}>30</option>
                              <option value={45}>45</option>
                            </select>
                            <select
                              value={startTime.period}
                              onChange={(e) => {
                                const newTime = convertTo24Hour(startTime.hours, startTime.minutes, e.target.value)
                                updateTimeRange(index, "start", newTime)
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1">End Time</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              value={endTime.hours}
                              onChange={(e) => {
                                const newTime = convertTo24Hour(
                                  Number.parseInt(e.target.value),
                                  endTime.minutes,
                                  endTime.period
                                )
                                updateTimeRange(index, "end", newTime)
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              {[...Array(12)].map((_, i) => {
                                const hour = i + 1
                                return (
                                  <option key={hour} value={hour}>
                                    {hour}
                                  </option>
                                )
                              })}
                            </select>
                            <select
                              value={endTime.minutes}
                              onChange={(e) => {
                                const newTime = convertTo24Hour(
                                  endTime.hours,
                                  Number.parseInt(e.target.value),
                                  endTime.period
                                )
                                updateTimeRange(index, "end", newTime)
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value={0}>00</option>
                              <option value={15}>15</option>
                              <option value={30}>30</option>
                              <option value={45}>45</option>
                            </select>
                            <select
                              value={endTime.period}
                              onChange={(e) => {
                                const newTime = convertTo24Hour(endTime.hours, endTime.minutes, e.target.value)
                                updateTimeRange(index, "end", newTime)
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      {timeRanges.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeRange(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Calendar Preview */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Calendar Preview</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  ←
                </Button>
                <span className="text-sm font-medium px-3 py-2">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  →
                </Button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay()
                const slots = getUnavailableSlotsForDate(dateStr)
                const blockHeight = getBlockHeight(slots)
                const blockStartOffset = getBlockStartOffset(slots)
                const hasUnavailability = slots.length > 0
                
                // Determine the color based on whether it's a specific date or recurring day
                const hasSpecificDate = unavailableSlots.some((slot) => slot.date === dateStr && !slot.isRecurring)
                const hasRecurring = slots.some((slot) => slot.isRecurring)

                return (
                  <button
                    key={day}
                    onClick={() => {
                      // Only set date range if clicking for the first time or if it's a different interaction
                      // Don't clear the recurring selection - let it remain highlighted
                      const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                      if (!startDate) {
                        setStartDate(dateStr)
                      } else if (!endDate) {
                        setEndDate(dateStr)
                      } else {
                        // If both are set, reset and start a new range
                        setStartDate(dateStr)
                        setEndDate("")
                      }
                    }}
                    className={cn(
                      "aspect-square rounded-lg border-2 bg-white hover:bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden transition-all cursor-pointer",
                      hasRecurring && "border-orange-400 ring-2 ring-orange-300 hover:border-orange-500",
                      !hasRecurring && selectedDays.includes(dayOfWeek) && "border-blue-500 ring-2 ring-blue-300 hover:border-blue-600",
                      !hasRecurring && !selectedDays.includes(dayOfWeek) && "border-gray-200 hover:border-blue-400",
                    )}
                  >
                    {/* Date number */}
                    <span className={cn(
                      "text-sm font-medium z-10",
                      hasRecurring && "text-orange-600 font-bold",
                      !hasRecurring && selectedDays.includes(dayOfWeek) && "text-blue-600 font-bold",
                      !hasRecurring && !selectedDays.includes(dayOfWeek) && "text-gray-700",
                    )}>
                      {day}
                    </span>
                    
                    {/* Time block indicator */}
                    {hasUnavailability && (
                      <div
                        className={cn(
                          "absolute left-0 right-0 transition-all",
                          hasSpecificDate && hasRecurring && "bg-gradient-to-b from-red-400 to-red-400 opacity-100",
                          hasSpecificDate && !hasRecurring && "bg-red-400",
                          !hasSpecificDate && hasRecurring && "bg-orange-400",
                        )}
                        style={{
                          top: `${blockStartOffset}%`,
                          height: `${blockHeight}%`,
                          minHeight: blockHeight > 0 ? "2px" : "0px",
                          backgroundImage: hasSpecificDate && hasRecurring 
                            ? "repeating-linear-gradient(45deg, rgb(248, 113, 113), rgb(248, 113, 113) 2px, rgb(249, 115, 22) 2px, rgb(249, 115, 22) 4px)"
                            : "none",
                          backgroundSize: hasSpecificDate && hasRecurring ? "auto" : "auto",
                        }}
                        title={`Blocked: ${calculateBlockedMinutes(slots)} minutes`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Add Unavailable Slot Button */}
          <Button 
            onClick={addUnavailableSlot} 
            className="w-full mt-6"
            disabled={(isRecurring && selectedDays.length === 0) || (!isRecurring && (!startDate || !endDate))}
          >
            {selectedDays.length > 0
              ? `Mark ${selectedDays.length} Recurring Day${selectedDays.length > 1 ? "s" : ""} as Unavailable`
              : `Mark Date Range as Unavailable`}
          </Button>
        </CardContent>
      </Card>

      {/* Unavailable Slots List */}
      {unavailableSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unavailable Periods</CardTitle>
            <CardDescription>Your space will not be available for booking during these times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const dateRanges = getCondensedDateRanges()
                const recurringSlots = unavailableSlots.filter((slot) => slot.isRecurring)

                return (
                  <>
                    {/* Render condensed or individual date ranges */}
                    {dateRanges.map((range, rangeIndex) => {
                      const dayCount = range.slots.length
                      const isCondensed = dayCount > 4

                      if (isCondensed) {
                        // Show condensed date range
                        return (
                          <div
                            key={`range-${rangeIndex}`}
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium mb-1">
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                  {formatDateRange(range.startDate, range.endDate)}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {range.slots[0].timeRanges.map((timeRange, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-medium">
                                      {formatTimeTo12Hour(timeRange.start)} -{" "}
                                      {formatTimeTo12Hour(timeRange.end)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                {dayCount} consecutive days
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Remove all slots in this range
                                const slotIds = range.slots.map((s) => s.id)
                                const updatedSlots = unavailableSlots.filter(
                                  (slot) => !slotIds.includes(slot.id)
                                )
                                onSlotsChange(updatedSlots)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      } else {
                        // Show individual days (4 or fewer)
                        return range.slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium mb-1">
                                <Badge variant="secondary" className="bg-red-100 text-red-700">
                                  {parseDateString(slot.date).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {slot.timeRanges.map((range, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-medium">
                                      {formatTimeTo12Hour(range.start)} -{" "}
                                      {formatTimeTo12Hour(range.end)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUnavailableSlot(slot.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      }
                    })}

                    {/* Render recurring slots */}
                    {recurringSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium mb-1">
                            {slot.recurringDay !== undefined ? (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                Every {daysOfWeek[slot.recurringDay]}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                Recurring (Invalid Day)
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Unavailable
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUnavailableSlot(slot.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded" />
          <span>Specific Date Unavailable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded" />
          <span>Recurring Day Unavailable</span>
        </div>
      </div>
    </div>
  )
}
