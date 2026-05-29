# Location Data Troubleshooting Guide

## Why Pins Are Not Showing on the Map

If you're not seeing pins on the map in the Find Space page, here are the most common reasons and solutions:

### 1. Missing Coordinate Data

**Problem:** Spaces in the database don't have latitude/longitude values populated.

**Check:**
```sql
SELECT 
  id, 
  title, 
  city, 
  state, 
  latitude, 
  longitude 
FROM public.spaces 
WHERE latitude IS NULL OR longitude IS NULL;
```

**Solution:** You need to geocode your addresses to get coordinates.

#### Option A: Manual Update (for testing)
Run the `scripts/017_add_sample_coordinates.sql` script to add sample coordinates.

#### Option B: Use Geocoding API (recommended for production)
1. Use Google Maps Geocoding API
2. Use Mapbox Geocoding API
3. Use OpenStreetMap Nominatim

Example with Google Maps Geocoding:
```typescript
async function geocodeAddress(address: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
  )
  const data = await response.json()
  if (data.results[0]) {
    return {
      latitude: data.results[0].geometry.location.lat,
      longitude: data.results[0].geometry.location.lng
    }
  }
  return null
}
```

### 2. Invalid Coordinate Format

**Problem:** Coordinates are stored in wrong format or out of valid range.

**Valid Ranges:**
- Latitude: -90 to 90
- Longitude: -180 to 180

**Check:**
```sql
SELECT 
  id, 
  title, 
  latitude, 
  longitude 
FROM public.spaces 
WHERE 
  latitude < -90 OR latitude > 90 OR
  longitude < -180 OR longitude > 180;
```

### 3. Data Type Issues

**Problem:** Coordinates stored as TEXT instead of DECIMAL/NUMERIC.

**Check:**
```sql
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'spaces' 
  AND column_name IN ('latitude', 'longitude');
```

**Expected:** `numeric` or `decimal`

### 4. Google Maps API Issues

**Problem:** Google Maps API key not configured or domain restrictions.

**Check Browser Console:**
- Look for Google Maps API errors
- Check for RefererNotAllowedMapError
- Verify API key is loaded

**Solution:** See `README_GOOGLE_MAPS.md` for API setup instructions.

### 5. Component Not Receiving Data

**Problem:** Data not being passed correctly from page to MapView component.

**Debug:**
Open browser console and look for these logs:
```
[v0] Total spaces received: X
[v0] Spaces with coordinates: Y
[v0] Creating marker for "Space Name" at {lat: X, lng: Y}
```

If you see "Total spaces received: 0", the issue is with data fetching, not the map.

### 6. RLS Policies Blocking Data

**Problem:** Row Level Security policies preventing data access.

**Check:**
```sql
SELECT * FROM public.spaces LIMIT 1;
```

If this returns no results but you know data exists, check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'spaces';
```

## Best Practices for Location Data

### 1. Always Geocode on Space Creation
Add a server action that geocodes the address when a new space is created:

```typescript
// In add-space-form submission
const coordinates = await geocodeAddress(
  `${formData.address_line1}, ${formData.city}, ${formData.state} ${formData.zip_code}`
)

if (coordinates) {
  formData.latitude = coordinates.latitude
  formData.longitude = coordinates.longitude
}
```

### 2. Validate Coordinates
Always validate that coordinates are within valid ranges before saving.

### 3. Handle Missing Coordinates Gracefully
- Show spaces without coordinates in list view
- Display a message in map view if no coordinates available
- Provide a way for hosts to update coordinates

### 4. Cache Geocoding Results
Don't geocode the same address multiple times. Store the results in the database.

### 5. Use Appropriate Precision
- For city-level: 4 decimal places (±11 meters)
- For street-level: 6 decimal places (±11 cm)
- For building-level: 8 decimal places (±1.1 mm)

Database schema uses DECIMAL(10, 8) for latitude and DECIMAL(11, 8) for longitude, which provides millimeter precision.

## Quick Fix for Testing

If you just want to see the map working with sample data:

1. Run the sample coordinates script:
```bash
# In Supabase SQL Editor
-- Run scripts/017_add_sample_coordinates.sql
```

2. Refresh the Find Space page

3. Click the "Map" view toggle

You should now see pins on the map for spaces with coordinates.

## Production Checklist

- [ ] All spaces have valid latitude/longitude
- [ ] Geocoding is automated on space creation
- [ ] Coordinates are validated before saving
- [ ] Google Maps API key is properly configured
- [ ] Domain restrictions are set up correctly
- [ ] RLS policies allow reading space coordinates
- [ ] Error handling for missing coordinates
- [ ] Fallback UI when no coordinates available
