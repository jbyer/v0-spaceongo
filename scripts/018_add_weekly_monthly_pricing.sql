-- Add weekly and monthly pricing columns to spaces table

-- Add price_per_week column
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS price_per_week DECIMAL(10, 2);

-- Add price_per_month column
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS price_per_month DECIMAL(10, 2);

-- Add comment to explain the pricing structure
COMMENT ON COLUMN public.spaces.price_per_week IS 'Weekly rental rate for the space';
COMMENT ON COLUMN public.spaces.price_per_month IS 'Monthly rental rate for the space';

-- Update existing spaces to have NULL for these new fields (they can be set later)
-- No default values needed as these are optional pricing tiers
