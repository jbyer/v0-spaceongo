export interface FilterState {
  location: string
  spaceType: string
  capacity: number
  priceRange: [number, number]
  amenities: string[]
}

export interface Space {
  id: string
  title: string
  space_type: string
  location: string
  city: string
  state: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  rating: number
  image_url: string | null
  description: string
  amenities: string[]
  is_active: boolean
  latitude: number | null
  longitude: number | null
}
