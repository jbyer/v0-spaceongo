-- Add user_role column to profiles table
-- This column stores the user's role (renter or host) for easier querying and filtering

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'renter' CHECK (user_role IN ('renter', 'host'));

-- Create an index on user_role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);

-- Update existing profiles based on is_host value
UPDATE public.profiles
SET user_role = CASE 
  WHEN is_host = TRUE THEN 'host'
  ELSE 'renter'
END
WHERE user_role IS NULL OR user_role = 'renter';
