-- Create space_availability table for granular availability management
-- This table stores specific date ranges and time slots when spaces are unavailable

-- Enable btree_gist extension to support UUID in GiST indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create the space_availability table
CREATE TABLE IF NOT EXISTS public.space_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  availability_status TEXT NOT NULL DEFAULT 'unavailable' CHECK (availability_status IN ('available', 'unavailable', 'blocked')),
  recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly')),
  recurrence_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_date is not before start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  
  -- Ensure end_time is after start_time if both are specified
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  
  -- Prevent overlapping unavailable periods for the same space
  EXCLUDE USING gist (
    space_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (availability_status = 'unavailable')
);

-- Create indexes for better query performance
-- Using standard B-tree indexes for UUID and date columns
CREATE INDEX IF NOT EXISTS idx_space_availability_space_id ON public.space_availability(space_id);
CREATE INDEX IF NOT EXISTS idx_space_availability_dates ON public.space_availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_space_availability_status ON public.space_availability(availability_status);

-- Optional: Create a GiST index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_space_availability_date_range 
  ON public.space_availability USING gist (daterange(start_date, end_date, '[]'));

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_space_availability_updated_at ON public.space_availability;
CREATE TRIGGER update_space_availability_updated_at 
  BEFORE UPDATE ON public.space_availability 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.space_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view availability for any space
CREATE POLICY "Anyone can view space availability"
  ON public.space_availability
  FOR SELECT
  USING (true);

-- RLS Policy: Only space owners can insert availability
CREATE POLICY "Space owners can insert availability"
  ON public.space_availability
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.spaces
      WHERE spaces.id = space_availability.space_id
      AND spaces.host_id = auth.uid()
    )
  );

-- RLS Policy: Only space owners can update availability
CREATE POLICY "Space owners can update availability"
  ON public.space_availability
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.spaces
      WHERE spaces.id = space_availability.space_id
      AND spaces.host_id = auth.uid()
    )
  );

-- RLS Policy: Only space owners can delete availability
CREATE POLICY "Space owners can delete availability"
  ON public.space_availability
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.spaces
      WHERE spaces.id = space_availability.space_id
      AND spaces.host_id = auth.uid()
    )
  );

-- Function to insert or update availability (UPSERT)
-- This function handles bulk insertions and updates
CREATE OR REPLACE FUNCTION upsert_space_availability(
  p_space_id UUID,
  p_availability_data JSONB
)
RETURNS TABLE (
  id UUID,
  space_id UUID,
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  availability_status TEXT,
  recurrence_type TEXT
) AS $$
DECLARE
  v_record JSONB;
  v_result RECORD;
BEGIN
  -- Loop through each availability record in the JSON array
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_availability_data)
  LOOP
    -- Insert or update the availability record
    INSERT INTO public.space_availability (
      space_id,
      start_date,
      end_date,
      start_time,
      end_time,
      availability_status,
      recurrence_type,
      recurrence_end_date,
      notes
    ) VALUES (
      p_space_id,
      (v_record->>'start_date')::DATE,
      (v_record->>'end_date')::DATE,
      (v_record->>'start_time')::TIME,
      (v_record->>'end_time')::TIME,
      COALESCE(v_record->>'availability_status', 'unavailable'),
      v_record->>'recurrence_type',
      (v_record->>'recurrence_end_date')::DATE,
      v_record->>'notes'
    )
    ON CONFLICT ON CONSTRAINT space_availability_pkey
    DO UPDATE SET
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      availability_status = EXCLUDED.availability_status,
      recurrence_type = EXCLUDED.recurrence_type,
      recurrence_end_date = EXCLUDED.recurrence_end_date,
      notes = EXCLUDED.notes,
      updated_at = NOW()
    RETURNING * INTO v_result;
    
    -- Return the inserted/updated record
    id := v_result.id;
    space_id := v_result.space_id;
    start_date := v_result.start_date;
    end_date := v_result.end_date;
    start_time := v_result.start_time;
    end_time := v_result.end_time;
    availability_status := v_result.availability_status;
    recurrence_type := v_result.recurrence_type;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage of the upsert function:
-- SELECT * FROM upsert_space_availability(
--   'space-uuid-here',
--   '[
--     {
--       "start_date": "2025-11-01",
--       "end_date": "2025-11-05",
--       "start_time": "09:00:00",
--       "end_time": "17:00:00",
--       "availability_status": "unavailable",
--       "recurrence_type": "none",
--       "notes": "Holiday closure"
--     },
--     {
--       "start_date": "2025-11-10",
--       "end_date": "2025-11-10",
--       "start_time": null,
--       "end_time": null,
--       "availability_status": "unavailable",
--       "recurrence_type": "weekly",
--       "recurrence_end_date": "2025-12-31",
--       "notes": "Closed every Sunday"
--     }
--   ]'::JSONB
-- );

-- Simple INSERT statement for single availability record
-- INSERT INTO public.space_availability (
--   space_id,
--   start_date,
--   end_date,
--   start_time,
--   end_time,
--   availability_status,
--   notes
-- ) VALUES (
--   'space-uuid-here',
--   '2025-11-01',
--   '2025-11-05',
--   '09:00:00',
--   '17:00:00',
--   'unavailable',
--   'Holiday closure'
-- );

-- Bulk INSERT with multiple records
-- INSERT INTO public.space_availability (space_id, start_date, end_date, start_time, end_time, availability_status, notes)
-- VALUES 
--   ('space-uuid', '2025-11-01', '2025-11-05', '09:00', '17:00', 'unavailable', 'Holiday'),
--   ('space-uuid', '2025-11-10', '2025-11-10', NULL, NULL, 'unavailable', 'Closed Sundays')
-- ON CONFLICT (id) DO UPDATE SET
--   start_date = EXCLUDED.start_date,
--   end_date = EXCLUDED.end_date,
--   availability_status = EXCLUDED.availability_status,
--   updated_at = NOW();
