-- Add username field to profiles table
-- This migration adds a unique username field with proper constraints

-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add unique constraint on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
ON public.profiles (LOWER(username));

-- Add check constraint for username format
-- Username must be 3-20 characters, start with a letter, and contain only alphanumeric, underscore, or hyphen
ALTER TABLE public.profiles
ADD CONSTRAINT username_format_check 
CHECK (
  username IS NULL OR (
    LENGTH(username) >= 3 AND 
    LENGTH(username) <= 20 AND
    username ~ '^[a-zA-Z][a-zA-Z0-9_-]*$'
  )
);

-- Add comment to explain the username field
COMMENT ON COLUMN public.profiles.username IS 'Unique username for user identification. Must be 3-20 characters, start with a letter, and contain only alphanumeric characters, underscores, or hyphens.';

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
