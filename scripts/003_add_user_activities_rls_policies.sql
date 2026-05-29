-- Add Row Level Security policies for user_activities table
-- This allows users to log their own activities and view them

-- Enable RLS on user_activities (if not already enabled)
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON public.user_activities;
DROP POLICY IF EXISTS "System can insert activities for any user" ON public.user_activities;

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert their own activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own activities
CREATE POLICY "Users can view their own activities" 
ON public.user_activities 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Admins and superusers can view all activities
CREATE POLICY "Admins can view all activities" 
ON public.user_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR is_superuser = true)
  )
);

-- Policy: Allow system/service role to insert activities for any user
-- This is useful for server-side operations that log activities on behalf of users
CREATE POLICY "System can insert activities for any user" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR auth.role() = 'service_role'
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON public.user_activities(activity_type);
