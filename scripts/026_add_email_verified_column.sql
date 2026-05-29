-- Add email_verified column to profiles table
-- This column tracks whether a user has verified their email address

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create an index on email_verified for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);
