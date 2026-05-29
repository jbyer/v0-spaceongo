-- Create user_activities table for comprehensive dashboard activity logging
-- This table tracks all user interactions within the dashboard environment

-- Drop table if exists (for development/testing)
DROP TABLE IF EXISTS public.user_activities CASCADE;

-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User identification
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT, -- Denormalized for quick access and historical record
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'login',
    'logout',
    'profile_update',
    'space_created',
    'space_updated',
    'space_deleted',
    'booking_created',
    'booking_cancelled',
    'review_posted',
    'message_sent',
    'favorite_added',
    'favorite_removed',
    'blog_post_created',
    'blog_post_updated',
    'settings_changed',
    'password_changed',
    'email_changed',
    'payment_method_added',
    'payout_received',
    'admin_action',
    'other'
  )),
  activity_description TEXT NOT NULL,
  
  -- Additional context (flexible JSON for various activity types)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Security and tracking
  ip_address INET,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  operating_system TEXT,
  
  -- Location data (optional)
  country TEXT,
  city TEXT,
  
  -- Status and flags
  is_suspicious BOOLEAN DEFAULT FALSE,
  is_admin_action BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_username ON public.user_activities(username);
CREATE INDEX IF NOT EXISTS idx_user_activities_is_suspicious ON public.user_activities(is_suspicious) WHERE is_suspicious = TRUE;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_activities_user_time ON public.user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type_time ON public.user_activities(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON public.user_activities(user_id, activity_type);

-- GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_user_activities_metadata ON public.user_activities USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own activities
CREATE POLICY "Users can view their own activities"
  ON public.user_activities
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all activities
CREATE POLICY "Admins can view all activities"
  ON public.user_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = TRUE OR profiles.is_superuser = TRUE)
    )
  );

-- RLS Policy: Only service role can insert activities (prevents user manipulation)
-- This means activities should be logged via server-side functions or triggers
CREATE POLICY "Service role can insert activities"
  ON public.user_activities
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_superuser = TRUE
    )
  );

-- RLS Policy: Admins can update suspicious flags
CREATE POLICY "Admins can update activity flags"
  ON public.user_activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = TRUE OR profiles.is_superuser = TRUE)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = TRUE OR profiles.is_superuser = TRUE)
    )
  );

-- RLS Policy: Only superusers can delete activities (for data retention compliance)
CREATE POLICY "Superusers can delete activities"
  ON public.user_activities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_superuser = TRUE
    )
  );

-- Create a function to automatically log activities
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id UUID;
  v_username TEXT;
BEGIN
  -- Get username from profiles
  SELECT username INTO v_username
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Insert activity log
  INSERT INTO public.user_activities (
    user_id,
    username,
    activity_type,
    activity_description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    v_username,
    p_activity_type,
    p_activity_description,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

-- Create a view for recent user activities (last 30 days)
CREATE OR REPLACE VIEW public.recent_user_activities AS
SELECT 
  ua.*,
  p.first_name,
  p.last_name,
  p.email,
  p.profile_image_url
FROM public.user_activities ua
JOIN public.profiles p ON ua.user_id = p.id
WHERE ua.created_at >= NOW() - INTERVAL '30 days'
ORDER BY ua.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON public.recent_user_activities TO authenticated;

-- Create a function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  activity_type TEXT,
  activity_count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.activity_type,
    COUNT(*) as activity_count,
    MAX(ua.created_at) as last_activity
  FROM public.user_activities ua
  WHERE ua.user_id = p_user_id
    AND ua.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY ua.activity_type
  ORDER BY activity_count DESC;
END;
$$;

-- Add comment to table
COMMENT ON TABLE public.user_activities IS 'Comprehensive logging of all user interactions within the dashboard environment';
COMMENT ON COLUMN public.user_activities.user_id IS 'Foreign key to profiles table';
COMMENT ON COLUMN public.user_activities.username IS 'Denormalized username for historical record and quick access';
COMMENT ON COLUMN public.user_activities.activity_type IS 'Categorized type of activity for filtering and analysis';
COMMENT ON COLUMN public.user_activities.activity_description IS 'Human-readable description of the activity';
COMMENT ON COLUMN public.user_activities.metadata IS 'Flexible JSON field for activity-specific data';
COMMENT ON COLUMN public.user_activities.is_suspicious IS 'Flag for security monitoring and anomaly detection';
