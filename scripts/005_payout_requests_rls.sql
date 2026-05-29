-- Enable Row Level Security
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payout requests
CREATE POLICY "Users can view own payout requests"
  ON public.payout_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own payout requests
CREATE POLICY "Users can create own payout requests"
  ON public.payout_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all payout requests
CREATE POLICY "Admins can view all payout requests"
  ON public.payout_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_superuser = true)
    )
  );

-- Policy: Admins can update payout requests
CREATE POLICY "Admins can update payout requests"
  ON public.payout_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_admin = true OR profiles.is_superuser = true)
    )
  );

-- Add comment
COMMENT ON POLICY "Users can view own payout requests" ON public.payout_requests IS 'Allow users to view their own payout requests';
COMMENT ON POLICY "Users can create own payout requests" ON public.payout_requests IS 'Allow users to create payout requests for their earnings';
COMMENT ON POLICY "Admins can view all payout requests" ON public.payout_requests IS 'Allow admins to view all payout requests';
COMMENT ON POLICY "Admins can update payout requests" ON public.payout_requests IS 'Allow admins to update payout request status';
