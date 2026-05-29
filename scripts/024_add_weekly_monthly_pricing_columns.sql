-- Add weekly and monthly pricing columns if they don't exist
-- These columns store pricing for weekly and monthly bookings

ALTER TABLE public.spaces
ADD COLUMN IF NOT EXISTS price_per_week DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_per_month DECIMAL(10, 2);
