"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Wifi,
  Car,
  Coffee,
  Utensils,
  Tv,
  Wind,
  Zap,
  Shield,
  Users,
  Printer,
  Phone,
  Camera,
  Music,
  Dumbbell,
  Waves,
  Gamepad2,
} from "lucide-react"

interface AmenitiesSelectorProps {
  selectedAmenities: string[]
  onAmenitiesChange: (amenities: string[]) => void
}

const amenityCategories = [
  {
    title: "Essential",
    amenities: [
      { id: "wifi", name: "WiFi", icon: Wifi },
      { id: "parking", name: "Parking", icon: Car },
      { id: "kitchen", name: "Kitchen Access", icon: Utensils },
      { id: "restroom", name: "Private Restroom", icon: Shield },
    ],
  },
  {
    title: "Comfort",
    amenities: [
      { id: "ac", name: "Air Conditioning", icon: Wind },
      { id: "heating", name: "Heating", icon: Zap },
      { id: "coffee", name: "Coffee/Tea", icon: Coffee },
      { id: "tv", name: "TV/Display", icon: Tv },
    ],
  },
  {
    title: "Business",
    amenities: [
      { id: "printer", name: "Printer/Scanner", icon: Printer },
      { id: "phone", name: "Phone Access", icon: Phone },
      { id: "projector", name: "Projector", icon: Camera },
      { id: "whiteboard", name: "Whiteboard", icon: Users },
    ],
  },
  {
    title: "Entertainment & Wellness",
    amenities: [
      { id: "sound", name: "Sound System", icon: Music },
      { id: "fitness", name: "Fitness Equipment", icon: Dumbbell },
      { id: "pool", name: "Pool/Spa", icon: Waves },
      { id: "games", name: "Games/Recreation", icon: Gamepad2 },
    ],
  },
]

export default function AmenitiesSelector({ selectedAmenities, onAmenitiesChange }: AmenitiesSelectorProps) {
  const handleAmenityToggle = (amenityId: string) => {
    const updatedAmenities = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter((id) => id !== amenityId)
      : [...selectedAmenities, amenityId]

    onAmenitiesChange(updatedAmenities)
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-2">Amenities ({selectedAmenities.length} selected)</h4>
        <p className="text-sm text-gray-600 mb-4">
          Select all amenities available in your space to help guests find what they need.
        </p>
      </div>

      {amenityCategories.map((category) => (
        <Card key={category.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{category.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {category.amenities.map((amenity) => {
                const Icon = amenity.icon
                const isSelected = selectedAmenities.includes(amenity.id)

                return (
                  <div
                    key={amenity.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => handleAmenityToggle(amenity.id)}
                  >
                    <Checkbox checked={isSelected} onChange={() => handleAmenityToggle(amenity.id)} />
                    <Icon className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-gray-600"}`} />
                    <span className={`text-sm ${isSelected ? "text-blue-900 font-medium" : "text-gray-700"}`}>
                      {amenity.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
