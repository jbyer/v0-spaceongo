# Booking Creation Troubleshooting Guide

## Overview

This guide helps diagnose why bookings might not be saved to the database after payment completion.

---

## Booking Flow Architecture

### Correct Flow (Now Implemented)
1. User fills out booking form on checkout page
2. **CREATE booking record** with `status: "pending"` and `payment_status: "pending"`
3. Create Stripe checkout session with `bookingId` in metadata
4. User completes payment on Stripe
5. Stripe webhook receives `checkout.session.completed` event
6. Webhook updates booking to `status: "confirmed"` and `payment_status: "paid"`
7. User sees booking in dashboard

### Previous Issue (Fixed)
The flow was missing step #2, which meant:
- No booking was created before payment
- Webhook had no `bookingId` to update
- Bookings were lost even after successful payment

---

## Common Issues & Solutions

### 1. Booking Not Created After Payment

**Symptoms:**
- Payment succeeds in Stripe
- No booking appears in `bookings` table
- User dashboard shows 0 bookings

**Causes:**
- ✅ **FIXED**: Booking not created before Stripe session
- Webhook not receiving events from Stripe
- Webhook endpoint not configured correctly
- Database insert failing silently

**Debug Steps:**
```sql
-- Check if booking was created with pending status
SELECT * FROM bookings 
WHERE guest_id = 'USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if payment was recorded
SELECT * FROM payments 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC;
```

**Solution:**
The `createBookingCheckoutSession()` function now:
1. Creates booking with `status: "pending"`
2. Includes `bookingId` in Stripe metadata
3. Webhook updates the existing booking

---

### 2. Booking Created But Status Not Updated

**Symptoms:**
- Booking exists with `status: "pending"`
- Payment succeeded in Stripe
- Booking never updated to `confirmed`

**Causes:**
- Webhook not processing `checkout.session.completed` events
- Stripe webhook secret misconfigured
- Webhook failing to find booking by ID

**Debug Steps:**
```bash
# Check Stripe webhook logs
# Go to: https://dashboard.stripe.com/test/webhooks

# Check application logs for webhook errors
console.log("[v0] Webhook event type:", event.type)
console.log("[v0] Booking ID from metadata:", metadata.bookingId)
```

**Solution:**
1. Verify webhook endpoint is configured in Stripe Dashboard
2. Check `STRIPE_WEBHOOK_SECRET` environment variable
3. Ensure webhook handler updates booking status correctly

---

### 3. Missing Metadata in Webhook

**Symptoms:**
- Webhook receives event
- `metadata.bookingId` is undefined
- Booking cannot be updated

**Causes:**
- Booking ID not included in Stripe session metadata
- Metadata not passed correctly from checkout

**Debug Steps:**
```typescript
// In webhook handler
console.log("[v0] Session metadata:", session.metadata)
console.log("[v0] Booking ID:", session.metadata.bookingId)
```

**Solution:**
Ensure `createBookingCheckoutSession()` includes all required metadata:
```typescript
metadata: {
  bookingId: booking.id,  // ← Must include this
  spaceId: bookingData.spaceId,
  guestId: user.id,
  // ... other fields
}
```

---

### 4. Database Validation Errors

**Symptoms:**
- Booking creation fails
- Error: "violates foreign key constraint"
- Error: "violates check constraint"

**Causes:**
- Invalid space_id (space doesn't exist)
- Invalid guest_id (user not authenticated)
- Invalid host_id (host doesn't exist)
- Invalid status value (not in allowed enum)

**Debug Steps:**
```sql
-- Verify space exists
SELECT id, title, host_id FROM spaces WHERE id = 'SPACE_ID';

-- Verify user exists
SELECT id, email FROM profiles WHERE id = 'USER_ID';

-- Check booking constraints
\d bookings
```

**Solution:**
1. Always validate space exists before creating booking
2. Ensure user is authenticated (`auth.uid()`)
3. Fetch host_id from space, don't trust user input
4. Use only valid status values: `pending`, `confirmed`, `cancelled`, `completed`, `refunded`

---

### 5. Row Level Security (RLS) Blocking Insert

**Symptoms:**
- Booking insert fails with permission error
- Error: "new row violates row-level security policy"

**Causes:**
- User trying to create booking with wrong `guest_id`
- RLS policy requires `auth.uid() = guest_id`

**Debug Steps:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'bookings';

-- Test if user can insert
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "USER_ID"}';
INSERT INTO bookings (...) VALUES (...);
```

**Solution:**
Ensure booking insert uses authenticated user's ID:
```typescript
const { data: { user } } = await supabase.auth.getUser()
await supabase.from("bookings").insert({
  guest_id: user.id,  // ← Must match authenticated user
  // ... other fields
})
```

---

### 6. Stripe Webhook Not Firing

**Symptoms:**
- Payment succeeds
- Webhook never receives event
- Booking stays in `pending` status

**Causes:**
- Webhook endpoint not added to Stripe
- Endpoint URL incorrect
- Endpoint returning errors (Stripe stops retrying)

**Debug Steps:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Check "Events" tab for recent attempts
3. Look for failed deliveries or errors
4. Check response status codes

**Solution:**
```bash
# Development: Use Stripe CLI to forward events
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Production: Add webhook endpoint in Stripe Dashboard
# URL: https://yourdomain.com/api/stripe/webhooks
# Events to listen for:
#   - checkout.session.completed
#   - payment_intent.succeeded
#   - payment_intent.payment_failed
```

---

### 7. Incorrect Booking Amount Calculation

**Symptoms:**
- Booking created but amount is wrong
- Total doesn't match space pricing

**Causes:**
- Incorrect duration calculation
- Wrong rental type (hourly vs daily)
- Service fee or tax calculation error

**Debug Steps:**
```typescript
console.log("[v0] Rental type:", rentalType)
console.log("[v0] Duration:", duration, rentalType === "daily" ? "days" : "hours")
console.log("[v0] Base price:", basePrice)
console.log("[v0] Service fee:", serviceFee)
console.log("[v0] Tax:", taxAmount)
console.log("[v0] Total:", totalAmount)
```

**Solution:**
Verify calculation logic:
- **Hourly**: `(endTime - startTime) × price_per_hour`
- **Daily**: `(endDate - startDate + 1) × price_per_day`
- **Service fee**: `basePrice × 0.03` (3%)
- **Tax**: `basePrice × 0.08` (8%)

---

## Verification Checklist

### Before Testing
- [ ] Supabase connection established
- [ ] `bookings` table exists in database
- [ ] RLS policies configured correctly
- [ ] Stripe integration configured
- [ ] Webhook endpoint added to Stripe
- [ ] Environment variables set correctly

### During Test Booking
- [ ] User is authenticated
- [ ] Space exists and is active
- [ ] Booking dates are valid (not in past)
- [ ] Payment amount calculated correctly
- [ ] Checkout session created successfully

### After Payment
- [ ] Booking created with `pending` status
- [ ] Stripe webhook received
- [ ] Booking updated to `confirmed` status
- [ ] Payment record created
- [ ] User can see booking in dashboard

---

## Monitoring & Logging

### Application Logs
Look for these console statements:
```
[v0] Creating booking for space: SPACE_ID
[v0] Booking created with ID: BOOKING_ID
[v0] Creating Stripe checkout session...
[v0] Stripe session created: SESSION_ID
[v0] Webhook received: checkout.session.completed
[v0] Updating booking BOOKING_ID to confirmed
[v0] Booking update successful
```

### Database Queries
```sql
-- Recent bookings
SELECT 
  id, 
  guest_id, 
  space_id, 
  status, 
  payment_status,
  total_amount,
  created_at 
FROM bookings 
ORDER BY created_at DESC 
LIMIT 20;

-- Pending bookings (might indicate webhook issues)
SELECT * FROM bookings 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

-- Failed payments
SELECT * FROM payments 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

---

## Emergency Fixes

### Manually Confirm a Pending Booking
```sql
UPDATE bookings 
SET 
  status = 'confirmed',
  payment_status = 'paid',
  updated_at = NOW()
WHERE id = 'BOOKING_ID' 
AND status = 'pending';
```

### Delete Test Bookings
```sql
DELETE FROM bookings 
WHERE guest_id = 'TEST_USER_ID' 
AND status = 'pending'
AND created_at > NOW() - INTERVAL '1 day';
```

---

## Contact Support

If issues persist after following this guide:

1. Collect error logs from browser console
2. Check Stripe webhook delivery logs
3. Export recent booking records from database
4. Contact support with all diagnostic information
