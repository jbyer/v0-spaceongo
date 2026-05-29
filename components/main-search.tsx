"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CalendarIcon, Users, MapPin, Sparkles } from 'lucide-react'
import { format } from "date-fns"
import React from "react"

const popularSearches = ["Photography Studio", "Meeting Room", "Event Venue", "Office Space", "Creative Space", "Workshop Space", "Restaurant"]

const activityOptions = [
  { value: "photography", label: "Photography Studio" },
  { value: "meeting", label: "Meeting Room" },
  { value: "event", label: "Event Venue" },
  { value: "creative", label: "Creative Space" },
  { value: "workshop", label: "Workshop Space" },
  { value: "office", label: "Office Space" },
  { value: "production", label: "Production Studio" },
  { value: "rehearsal", label: "Rehearsal Space" },
]

export default function MainSearch() {
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [guests, setGuests] = React.useState<string>("1")
  const [location, setLocation] = React.useState<string>("")
  const [activity, setActivity] = React.useState<string>("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)

  const handleSearch = () => {
    // Handle search logic here
    console.log("Searching with:", { activity, location, date, guests })
  }

  return (
    <div className="flex justify-center py-8 px-4 md:py-10">
      <div className="w-full max-w-4xl">
        {/* Search Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What are you planning?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the perfect space for your next project, event, or creative endeavor
          </p>
        </div>

        {/* Main Search Form */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* What - Activity Input/Select */}
            <div className="flex-1 w-full lg:w-auto relative">
              <div className="px-6 py-3 border-r border-gray-100 last:border-r-0">
                <label htmlFor="activity" className="block text-sm font-semibold text-gray-700 mb-1">
                  Type of space
                </label>

                <div className="relative hidden md:block">
                  <Input
                    id="activity"
                    placeholder="Click here..."
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="border-none focus-visible:ring-0 text-base placeholder:text-gray-400 pl-8"
                  />
                  <Sparkles className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>

                <div className="block md:hidden">
                  <Select value={activity} onValueChange={setActivity}>
                    <SelectTrigger className="border-none focus:ring-0 text-base pl-8">
                      <Sparkles className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Select activity type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Suggestions - Desktop only */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 hidden md:block">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Popular Searches</div>
                      {popularSearches.map((search, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm"
                          onClick={() => {
                            setActivity(search)
                            setShowSuggestions(false)
                          }}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Where - Location Input */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="px-6 py-3 border-r border-gray-100 last:border-r-0">
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">
                  Where?
                </label>
                <div className="relative">
                  <Input
                    id="location"
                    placeholder="City, neighborhood, address..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-none focus-visible:ring-0 text-base placeholder:text-gray-400 pl-8"
                  />
                  <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* When - Date Picker */}
            <div className="flex-1 w-full lg:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex-1 w-full lg:w-auto px-6 py-3 flex flex-col items-start justify-center h-auto hover:bg-transparent border-r border-gray-100 last:border-r-0"
                  >
                    <span className="text-sm font-semibold text-gray-700 mb-1">When?</span>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-normal text-base text-gray-600">
                        {date ? format(date, "MMM dd") : "Add dates"}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Who - Guests */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="px-6 py-3">
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger className="flex flex-col items-start justify-center h-auto border-none focus:ring-0 hover:bg-transparent">
                    <span className="text-sm font-semibold text-gray-700 mb-1">How Many?</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <SelectValue placeholder="Add guests" className="text-base" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 person</SelectItem>
                    <SelectItem value="2-5">2-5 people</SelectItem>
                    <SelectItem value="6-10">6-10 people</SelectItem>
                    <SelectItem value="11-25">11-25 people</SelectItem>
                    <SelectItem value="26-50">26-50 people</SelectItem>
                    <SelectItem value="50+">50+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className="rounded-full h-14 w-14 lg:h-12 lg:w-12 flex items-center justify-center shrink-0 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search spaces</span>
            </Button>
          </div>
        </div>

        {/* Quick Filters */}

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm">Instant booking available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Verified hosts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm">Secure payments</span>
          </div>
        </div>
      </div>
    </div>
  )
}
