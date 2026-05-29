-- Create space_views table for detailed view tracking
CREATE TABLE IF NOT EXISTS public.space_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_space_views_space_id ON public.space_views(space_id);
CREATE INDEX IF NOT EXISTS idx_space_views_viewer_id ON public.space_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_space_views_viewed_at ON public.space_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_space_views_device_type ON public.space_views(device_type);

-- Create a function to increment space view count
CREATE OR REPLACE FUNCTION increment_space_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.spaces
  SET view_count = view_count + 1
  WHERE id = NEW.space_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment view count
DROP TRIGGER IF EXISTS trigger_increment_space_view_count ON public.space_views;
CREATE TRIGGER trigger_increment_space_view_count
AFTER INSERT ON public.space_views
FOR EACH ROW
EXECUTE FUNCTION increment_space_view_count();

-- Add RLS policies for space_views
ALTER TABLE public.space_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (for tracking)
CREATE POLICY "Anyone can insert space views"
  ON public.space_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to view their own views
CREATE POLICY "Users can view their own views"
  ON public.space_views
  FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());

-- Allow space hosts to view their space's views
CREATE POLICY "Hosts can view their space views"
  ON public.space_views
  FOR SELECT
  TO authenticated
  USING (
    space_id IN (
      SELECT id FROM public.spaces WHERE host_id = auth.uid()
    )
  );

-- Allow admins to view all views
CREATE POLICY "Admins can view all space views"
  ON public.space_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_superuser = true)
    )
  );
