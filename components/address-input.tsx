"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Info } from "lucide-react"

interface AddressInputProps {
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  onAddressChange: (address: any) => void
}

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

export default function AddressInput({ address, onAddressChange }: AddressInputProps) {
  const handleInputChange = (field: string, value: string) => {
    onAddressChange({
      ...address,
      [field]: value,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium">Space Address</h4>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p>
                Your exact address will only be shared with confirmed guests. We'll show the general area to potential
                renters.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <Label htmlFor="street" className="flex items-center gap-1">
            Street Address <span className="text-red-600">*</span>
            <span className="text-red-600 text-xs font-normal">(required)</span>
          </Label>
          <Input
            id="street"
            placeholder="123 Main Street"
            value={address.street}
            onChange={(e) => handleInputChange("street", e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className="flex items-center gap-1">
              City <span className="text-red-600">*</span>
              <span className="text-red-600 text-xs font-normal">(required)</span>
            </Label>
            <Input
              id="city"
              placeholder="New York"
              value={address.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="zipCode" className="flex items-center gap-1">
              ZIP Code <span className="text-red-600">*</span>
              <span className="text-red-600 text-xs font-normal">(required)</span>
            </Label>
            <Input
              id="zipCode"
              placeholder="10001"
              value={address.zipCode}
              onChange={(e) => handleInputChange("zipCode", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="state" className="flex items-center gap-1">
            State <span className="text-red-600">*</span>
            <span className="text-red-600 text-xs font-normal">(required)</span>
          </Label>
          <select
            id="state"
            value={address.state}
            onChange={(e) => handleInputChange("state", e.target.value)}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a state</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
