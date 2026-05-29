"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Building, Camera, Calendar, ChefHat, ShoppingBag, Home, Music, Dumbbell } from "lucide-react"

interface SpaceTypeSelectorProps {
  selectedType: string
  onTypeSelect: (type: string) => void
}

const spaceTypes = [
  {
    id: "office",
    name: "Office Space",
    description: "Private offices, coworking spaces, meeting rooms",
    icon: Building,
  },
  {
    id: "studio",
    name: "Studio",
    description: "Photo studios, art studios, creative spaces",
    icon: Camera,
  },
  {
    id: "event",
    name: "Event Space",
    description: "Party venues, conference rooms, wedding halls",
    icon: Calendar,
  },
  {
    id: "kitchen",
    name: "Restaurant/Kitchen",
    description: "Commercial kitchens, restaurants, food prep areas",
    icon: ChefHat,
  },
  {
    id: "retail",
    name: "Retail Space",
    description: "Pop-up shops, showrooms, retail locations",
    icon: ShoppingBag,
  },
  {
    id: "residential",
    name: "Residential",
    description: "Apartments, houses, vacation rentals",
    icon: Home,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Theaters, music venues, gaming spaces",
    icon: Music,
  },
  {
    id: "fitness",
    name: "Fitness/Wellness",
    description: "Gyms, yoga studios, wellness centers",
    icon: Dumbbell,
  },
]

export default function SpaceTypeSelector({ selectedType, onTypeSelect }: SpaceTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {spaceTypes.map((type) => {
        const Icon = type.icon
        return (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === type.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
            }`}
            onClick={() => onTypeSelect(type.id)}
          >
            <CardContent className="p-4 text-center">
              <Icon
                className={`h-8 w-8 mx-auto mb-2 ${selectedType === type.id ? "text-blue-600" : "text-gray-600"}`}
              />
              <h4 className="font-medium text-sm mb-1">{type.name}</h4>
              <p className="text-xs text-gray-500">{type.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
