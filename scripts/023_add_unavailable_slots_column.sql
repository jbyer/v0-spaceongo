-- Add unavailable_slots column to spaces table
-- This column stores the unavailable time slots for a space

ALTER TABLE public.spaces
ADD COLUMN IF NOT EXISTS unavailable_slots JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_spaces_unavailable_slots ON public.spaces USING GIN (unavailable_slots);
