"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { useCurrency } from "@/contexts/currency-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Search, MapPin } from "lucide-react"
import type { FilterState } from "@/app/find-space/page"

interface SearchFiltersProps {
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
}

export default function SearchFilters({ filters, setFilters }: SearchFiltersProps) {
  const { formatPrice } = useCurrency()
  const spaceTypes = [
    "Office",
    "Co-working Space",
    "Restaurant",
    "Studio",
    "Storage Facility",
    "Business Center",
    "Conference Room",
    "Event Space",
    "Greenroom",
  ]

  const availableAmenities = [
    "WiFi",
    "Parking",
    "Kitchen",
    "Air Conditioning",
    "Projector",
    "Whiteboard",
    "Sound System",
    "Security",
    "24/7 Access",
    "Catering",
  ]

  const handleLocationChange = (value: string) => {
    setFilters((prev) => ({ ...prev, location: value }))
  }

  const handleSpaceTypeChange = (value: string) => {
    setFilters((prev) => ({ ...prev, spaceType: value }))
  }

  const handleCapacityChange = (value: number[]) => {
    setFilters((prev) => ({ ...prev, capacity: value[0] }))
  }

  const handlePriceRangeChange = (value: number[]) => {
    setFilters((prev) => ({ ...prev, priceRange: [value[0], value[0] + 500] as [number, number] }))
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      amenities: checked ? [...prev.amenities, amenity] : prev.amenities.filter((a) => a !== amenity),
    }))
  }

  const clearFilters = () => {
    setFilters({
      location: "",
      spaceType: "",
      capacity: 1,
      priceRange: [0, 1000],
      amenities: [],
    })
  }

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Search Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="location"
              placeholder="City, address, or landmark"
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Space Type */}
        <div className="space-y-2">
          <Label htmlFor="space-type">Space Type</Label>
          <Select value={filters.spaceType} onValueChange={handleSpaceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select space type" />
            </SelectTrigger>
            <SelectContent>
              {spaceTypes.map((type) => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <Label>Capacity: {filters.capacity} people</Label>
          <Slider
            value={[filters.capacity]}
            onValueChange={handleCapacityChange}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label>
            Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}/day
          </Label>
          <Slider
            value={[filters.priceRange[0]]}
            onValueChange={handlePriceRangeChange}
            max={1000}
            min={0}
            step={50}
            className="w-full"
          />
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <Label>Amenities</Label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {availableAmenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity}
                  checked={filters.amenities.includes(amenity)}
                  onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                />
                <Label htmlFor={amenity} className="text-sm font-normal">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {(filters.location || filters.spaceType || filters.amenities.length > 0) && (
          <div className="space-y-2">
            <Label>Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.location}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleLocationChange("")} />
                </Badge>
              )}
              {filters.spaceType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {spaceTypes.find((type) => type.toLowerCase() === filters.spaceType)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleSpaceTypeChange("")} />
                </Badge>
              )}
              {filters.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                  {amenity}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleAmenityChange(amenity, false)} />
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="pt-4 border-t">
          <Button className="w-full bg-transparent" variant="outline">
            <MapPin className="h-4 w-4 mr-2" />
            Search this area
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
