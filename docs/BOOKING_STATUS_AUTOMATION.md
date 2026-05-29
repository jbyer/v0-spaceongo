# Booking Status Automation System

## Overview

The SpaceOnGo booking system uses automated status updates to ensure bookings reflect their current state throughout their lifecycle.

## Booking Status Lifecycle

### Status Values

- **pending** - Initial status when booking is created, awaiting payment
- **confirmed** - Payment successful, booking is active
- **completed** - Booking end time has passed
- **cancelled** - Booking was cancelled by guest or host
- **refunded** - Payment was refunded

### Automatic Status Transitions

#### 1. Payment Completion: pending → confirmed

**Trigger:** Stripe webhook `checkout.session.completed`  
**Handler:** `app/api/stripe/webhooks/route.ts`  
**Actions:**
- Updates `status` from "pending" to "confirmed"
- Sets `payment_status` to "paid"
- Stores `payment_intent_id`
- Creates payment record in database
- Sends confirmation notification to guest

```typescript
// Webhook handler automatically triggers on successful payment
await supabase
  .from("bookings")
  .update({
    status: "confirmed",
    payment_status: "paid",
    payment_intent_id: session.payment_intent,
    updated_at: new Date().toISOString(),
  })
  .eq("id", bookingId)
```

#### 2. Booking End: confirmed → completed

**Trigger:** Cron job (daily)  
**Endpoint:** `POST /api/bookings/update-status`  
**Condition:** `end_date < current_time` AND `status = "confirmed"`

This transition is **NOT automatic by default** and requires either:
- A daily cron job (recommended)
- Manual API trigger
- Vercel Cron Jobs configuration

**Actions:**
- Updates status to "completed"
- Sends notifications to guest (prompting for review)
- Sends notifications to host

#### 3. Expired Unpaid: pending → cancelled

**Trigger:** Cron job (daily)  
**Condition:** `start_date < current_time` AND `status = "pending"` AND `payment_status = "pending"`

**Actions:**
- Updates status to "cancelled"
- Sets cancellation reason
- Sends notification to guest

## Current Issue: Missing Automation

### Problem

Currently, **bookings remain in "pending" or "confirmed" status indefinitely** because:

1. No cron job is configured to run the status update endpoint
2. Test bookings were never paid, so they stayed "pending"
3. There's no manual process to mark old bookings as completed

### Why Past Bookings Show "Pending"

Looking at the debug logs:
```
Booking db1847f4-2a8f-49e0-bfed-5b7412e04897 - Status: pending
Start: 2025-12-10T21:00:00+00:00
End: 2025-12-10T21:00:00+00:00
```

These bookings:
- Were created on Dec 10, 2025
- Never completed payment (stayed "pending")
- Should have been auto-cancelled since the start date passed without payment
- Should show as "expired" or "cancelled" in the Past tab

## Solution: Set Up Automated Status Updates

### Option 1: Vercel Cron Jobs (Recommended for Production)

1. Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/bookings/update-status",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours to update booking statuses.

2. Add a secret for cron authentication:

```bash
# In Vercel dashboard or via CLI
vercel env add CRON_SECRET
# Enter a secure random string
```

3. The cron job will automatically call the endpoint with authorization

### Option 2: External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron**
- **GitHub Actions**

Configure to call:
```
POST https://yourdomain.com/api/bookings/update-status
Authorization: Bearer YOUR_CRON_SECRET
```

### Option 3: Manual Trigger (For Development/Testing)

Trigger the status update manually:

```bash
# Using curl
curl -X POST https://your-domain.com/api/bookings/update-status \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Or simply visit in browser (GET request works too for testing)
https://your-domain.com/api/bookings/update-status
```

## Immediate Fix for Existing Data

To fix the current "pending" bookings in your database:

### Run One-Time Update

1. Call the update endpoint manually:
```bash
curl -X POST https://your-domain.com/api/bookings/update-status
```

2. Or run SQL directly in Supabase:

```sql
-- Update expired confirmed bookings to completed
UPDATE bookings
SET status = 'completed', updated_at = NOW()
WHERE status IN ('confirmed', 'pending')
  AND end_date < NOW();

-- Cancel expired unpaid bookings
UPDATE bookings
SET 
  status = 'cancelled',
  cancellation_reason = 'Payment not completed before booking start time',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE status = 'pending'
  AND payment_status = 'pending'
  AND start_date < NOW();
```

## Monitoring & Logs

The status update job logs all actions:

```
[v0] Starting booking status update job...
[v0] Found 2 bookings that have ended
[v0] Updated booking db1847f4-2a8f-49e0-bfed-5b7412e04897 to completed
[v0] Updated booking 268ec4c4-11e8-4952-b927-41a3f41b9e37 to completed
[v0] Booking status update complete. Updated 2 bookings.
```

Check Vercel logs or your hosting provider's logs to verify the cron job runs successfully.

## Testing

### Test the Endpoint

```bash
# Test with a GET request (no auth required for testing)
curl https://your-domain.com/api/bookings/update-status

# Expected response:
{
  "success": true,
  "updatedCount": 2,
  "message": "Updated 2 booking statuses"
}
```

### Verify Database Changes

```sql
-- Check booking statuses
SELECT id, status, start_date, end_date, payment_status
FROM bookings
ORDER BY created_at DESC
LIMIT 10;
```

## Best Practices

1. **Run cron job every 6-24 hours** - Balance between timeliness and API usage
2. **Monitor cron job execution** - Set up alerts for failures
3. **Log all status changes** - Keep audit trail for debugging
4. **Send user notifications** - Inform users when their bookings complete
5. **Handle edge cases** - Same-day bookings, timezone differences, etc.

## Related Files

- **Status Update Endpoint:** `app/api/bookings/update-status/route.ts`
- **Stripe Webhook:** `app/api/stripe/webhooks/route.ts` (handles payment → confirmed)
- **Booking Status Helpers:** `lib/api/bookings.ts`
- **Database Schema:** `scripts/001_create_database_schema.sql`

## Troubleshooting

### Bookings Stay "Pending" Forever

**Cause:** Cron job not set up OR bookings were never paid

**Fix:** 
1. Set up automated cron job
2. For test bookings, manually update status or delete them

### Bookings Don't Show in "Past" Tab

**Cause:** Status filter requires specific values

**Fix:** The Past tab now shows ANY booking where `end_date < now`, regardless of status

### Cron Job Not Running

**Cause:** Missing `CRON_SECRET` or incorrect Vercel configuration

**Fix:**
1. Verify `vercel.json` exists and is correct
2. Check Vercel dashboard → Project Settings → Cron Jobs
3. Add `CRON_SECRET` environment variable
