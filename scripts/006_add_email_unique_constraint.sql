-- Add unique constraint to profiles.email if not already present
-- This migration ensures email uniqueness for proper conflict handling

-- Adding unique constraint to email column for ON CONFLICT support
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create index for faster email lookups if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_email_unique';
