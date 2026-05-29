-- One-time script to fix existing booking statuses
-- Run this in Supabase SQL Editor

-- 1. Update expired confirmed bookings to completed
UPDATE bookings
SET 
  status = 'completed',
  updated_at = NOW()
WHERE status IN ('confirmed', 'pending')
  AND payment_status = 'paid'
  AND end_date < NOW();

-- 2. Cancel expired unpaid bookings (never completed payment)
UPDATE bookings
SET 
  status = 'cancelled',
  cancellation_reason = 'Payment not completed before booking start time',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE status = 'pending'
  AND payment_status = 'pending'
  AND start_date < NOW();

-- 3. View the results
SELECT 
  id,
  status,
  payment_status,
  start_date,
  end_date,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 20;
