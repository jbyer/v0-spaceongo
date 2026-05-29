-- Add sample coordinates to existing spaces for testing
-- This script updates spaces with realistic US coordinates based on their city and state

-- Removed all references to non-existent 'location' column, using only 'city' and 'state'

-- Update "The Mud Room" in Plano, TX with correct coordinates
UPDATE public.spaces 
SET 
  latitude = 33.0198,
  longitude = -96.6989
WHERE (latitude IS NULL OR longitude IS NULL)
  AND title = 'The Mud Room'
  AND city ILIKE '%Plano%';

-- Update any spaces in Plano, TX
UPDATE public.spaces 
SET 
  latitude = 33.0198,
  longitude = -96.6989
WHERE (latitude IS NULL OR longitude IS NULL)
  AND city ILIKE '%plano%';

-- Update spaces in major US cities using subquery approach
-- New York
UPDATE public.spaces 
SET 
  latitude = 40.7128,
  longitude = -74.0060
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%new york%'
  LIMIT 5
);

-- Los Angeles
UPDATE public.spaces 
SET 
  latitude = 34.0522,
  longitude = -118.2437
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%los angeles%'
  LIMIT 5
);

-- Chicago
UPDATE public.spaces 
SET 
  latitude = 41.8781,
  longitude = -87.6298
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%chicago%'
  LIMIT 5
);

-- Houston
UPDATE public.spaces 
SET 
  latitude = 29.7604,
  longitude = -95.3698
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%houston%'
  LIMIT 5
);

-- Phoenix
UPDATE public.spaces 
SET 
  latitude = 33.4484,
  longitude = -112.0740
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%phoenix%'
  LIMIT 5
);

-- San Francisco
UPDATE public.spaces 
SET 
  latitude = 37.7749,
  longitude = -122.4194
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%san francisco%'
  LIMIT 5
);

-- Dallas
UPDATE public.spaces 
SET 
  latitude = 32.7767,
  longitude = -96.7970
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%dallas%'
  LIMIT 5
);

-- Austin
UPDATE public.spaces 
SET 
  latitude = 30.2672,
  longitude = -97.7431
WHERE id IN (
  SELECT id FROM public.spaces 
  WHERE (latitude IS NULL OR longitude IS NULL)
    AND city ILIKE '%austin%'
  LIMIT 5
);

-- Updated SELECT queries to use only existing columns
-- Count how many spaces still need coordinates
SELECT 
  COUNT(*) as spaces_without_coordinates,
  COALESCE(city, 'Unknown') as city,
  COALESCE(state, 'Unknown') as state
FROM public.spaces 
WHERE latitude IS NULL OR longitude IS NULL
GROUP BY city, state
ORDER BY spaces_without_coordinates DESC;

-- Show updated spaces with coordinates
SELECT 
  id,
  title,
  city,
  state,
  latitude,
  longitude
FROM public.spaces 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Note: For production, you should:
-- 1. Use a geocoding service (Google Maps Geocoding API, Mapbox, etc.)
-- 2. Geocode the full address (address_line1, city, state, zip_code)
-- 3. Store the accurate latitude/longitude in the database
-- 4. Add a geocoding function to automatically geocode new spaces on insert
