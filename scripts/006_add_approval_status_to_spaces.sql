-- Add approval_status column to spaces table
-- This enables admin review workflow for new space listings

ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_spaces_approval_status ON public.spaces(approval_status);

-- Update existing spaces to 'approved' status
UPDATE public.spaces 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.spaces.approval_status IS 'Approval status for space listings: pending (awaiting review), approved (live), rejected (not approved)';
