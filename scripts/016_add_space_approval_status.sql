-- Add approval status to spaces table
-- This allows admin to review and approve new space listings before they go live

-- Add approval_status column to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approved_at and approved_by columns for tracking
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_spaces_approval_status ON public.spaces(approval_status);

-- Update existing spaces to be approved (backward compatibility)
UPDATE public.spaces 
SET approval_status = 'approved', 
    approved_at = created_at 
WHERE approval_status = 'pending';

-- Add comment for documentation
COMMENT ON COLUMN public.spaces.approval_status IS 'Status of space listing approval: pending (awaiting review), approved (live), rejected (not approved)';
COMMENT ON COLUMN public.spaces.approved_at IS 'Timestamp when the space was approved by admin';
COMMENT ON COLUMN public.spaces.approved_by IS 'Admin user who approved the space';
COMMENT ON COLUMN public.spaces.rejection_reason IS 'Reason provided if space was rejected';
