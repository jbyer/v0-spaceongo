-- Add 'host' boolean field to profiles table (alias for is_host for clarity)
-- This field indicates if the user registered as a host through the List Your Space page

-- Add the host column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS host BOOLEAN DEFAULT false;

-- Sync existing is_host values to the new host column
UPDATE profiles SET host = is_host WHERE host IS NULL OR host != is_host;

-- Create an index for faster queries on host status
CREATE INDEX IF NOT EXISTS idx_profiles_host ON profiles(host);

-- Add a comment to document the field
COMMENT ON COLUMN profiles.host IS 'Indicates if user registered as a space host through the List Your Space page';
