-- Create payout requests table
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  payout_method TEXT CHECK (payout_method IN ('paypal', 'skrill', 'wire_transfer', 'bank_transfer')),
  payout_details JSONB,
  notes TEXT,
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_id ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON public.payout_requests(created_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_payout_requests_updated_at ON public.payout_requests;
CREATE TRIGGER update_payout_requests_updated_at 
  BEFORE UPDATE ON public.payout_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.payout_requests IS 'Stores payout requests from users for earnings from their spaces';
