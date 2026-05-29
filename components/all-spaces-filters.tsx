"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, MapPin, Users, X, CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from "date-fns"
import { useCurrency } from "@/contexts/currency-context"

interface Filters {
  search: string
  type: string | string[]
  location: string
  minPrice: number
  maxPrice: number
  capacity: number
  amenities: string[]
  startDate?: Date
  endDate?: Date
}

interface AllSpacesFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const spaceTypes = ["Office","Co-working","Restaurant","Studio","Conference Room","Event Space","Storage","Home", "Business Center","Greenroom"]

const commonAmenities = [
  "WiFi",
  "Parking",
  "Kitchen",
  "Sound System",
  "Projector",
  "Whiteboard",
  "Coffee",
  "Catering",
  "Lighting",
  "Security",
  "Climate Control",
  "Loading Dock",
  "Commercial Equipment",
]

export function AllSpacesFilters({ filters, onFiltersChange }: AllSpacesFiltersProps) {
  const { formatPrice } = useCurrency()
  const [priceRange, setPriceRange] = useState([filters.minPrice, filters.maxPrice])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.startDate,
    to: filters.endDate,
  })
  const [expandedSections, setExpandedSections] = useState({
    spaceType: true,
    amenities: true,
  })

  const updateFilters = (updates: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const toggleSpaceType = (type: string) => {
    const currentTypes = Array.isArray(filters.type) ? filters.type : filters.type ? [filters.type] : []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type]
    updateFilters({ type: newTypes })
  }

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity]
    updateFilters({ amenities: newAmenities })
  }

  const clearAllFilters = () => {
    const defaultFilters: Filters = {
      search: "",
      type: [],
      location: "",
      minPrice: 0,
      maxPrice: 1000,
      capacity: 0,
      amenities: [],
      startDate: undefined,
      endDate: undefined,
    }
    onFiltersChange(defaultFilters)
    setPriceRange([0, 1000])
    setDateRange({ from: undefined, to: undefined })
  }

  const selectedTypes = Array.isArray(filters.type) ? filters.type : filters.type ? [filters.type] : []
  const hasActiveFilters =
    filters.search ||
    selectedTypes.length > 0 ||
    filters.location ||
    filters.capacity > 0 ||
    filters.amenities.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 1000 ||
    filters.startDate ||
    filters.endDate

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
    }
    if (dateRange.from) {
      return format(dateRange.from, "MMM d, yyyy")
    }
    return "Select dates"
  }

  const toggleSection = (section: 'spaceType' | 'amenities') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTypes.length > 0 && (
              <div className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full">
                <span className="font-medium">{selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {filters.amenities.length > 0 && (
              <div className="inline-flex items-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs px-2 py-1 rounded-full">
                <span className="font-medium">{filters.amenities.length} amenity{filters.amenities.length > 1 ? 'ies' : 'y'}</span>
              </div>
            )}
            {filters.location && (
              <div className="inline-flex items-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 text-xs px-2 py-1 rounded-full">
                <MapPin className="h-3 w-3 mr-1" />
                <span>Location</span>
              </div>
            )}
            {(filters.minPrice > 0 || filters.maxPrice < 1000) && (
              <div className="inline-flex items-center bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 text-xs px-2 py-1 rounded-full">
                <span>{formatPrice(filters.minPrice)}-{formatPrice(filters.maxPrice)}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spaces..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Availability Calendar */}
        <div>
          <label className="text-sm font-medium mb-2 block">Availability</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range || { from: undefined, to: undefined })
                  updateFilters({
                    startDate: range?.from,
                    endDate: range?.to,
                  })
                }}
                numberOfMonths={2}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
          {(dateRange.from || dateRange.to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateRange({ from: undefined, to: undefined })
                updateFilters({ startDate: undefined, endDate: undefined })
              }}
              className="w-full mt-2 text-xs"
            >
              Clear dates
            </Button>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter city or area..."
              value={filters.location}
              onChange={(e) => updateFilters({ location: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Space Type - Multiple Selection */}
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => toggleSection('spaceType')}
          >
            <label className="text-sm font-medium">
              Space Type {selectedTypes.length > 0 && `(${selectedTypes.length} selected)`}
            </label>
            {expandedSections.spaceType ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          {expandedSections.spaceType && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {spaceTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleSpaceType(type)}
                  />
                  <label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer flex-1">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Daily Rate: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}{priceRange[1] >= 1000 ? "+" : ""}
          </label>
          <Slider
            value={priceRange}
            onValueChange={(value) => {
              setPriceRange(value)
              updateFilters({ minPrice: value[0], maxPrice: value[1] })
            }}
            max={1000}
            min={0}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatPrice(0)}</span>
            <span>{formatPrice(1000)}+</span>
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="text-sm font-medium mb-2 block">Minimum Capacity</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="0"
              value={filters.capacity || ""}
              onChange={(e) => updateFilters({ capacity: Number.parseInt(e.target.value) || 0 })}
              className="pl-10"
              min="0"
            />
          </div>
        </div>

        {/* Amenities - Multiple Selection */}
        <div>
          <div 
            className="flex items-center justify-between mb-3 cursor-pointer"
            onClick={() => toggleSection('amenities')}
          >
            <label className="text-sm font-medium">
              Amenities {filters.amenities.length > 0 && `(${filters.amenities.length} selected)`}
            </label>
            {expandedSections.amenities ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          {expandedSections.amenities && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {commonAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={filters.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <label htmlFor={`amenity-${amenity}`} className="text-sm font-normal cursor-pointer flex-1">
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
