# Duplicate Verification Email Fix

## Problem
Users were receiving **two verification emails** upon registration:
1. One from Supabase's built-in auth system
2. One from our custom Resend integration

## Root Cause
The `supabase.auth.signUp()` calls in both the main sign-up page and registration popup included the `emailRedirectTo` parameter, which automatically triggers Supabase's default confirmation email. Then, the code explicitly called `/api/resend/send-verification` to send a custom-branded email via Resend, resulting in duplicate emails.

## Solution Applied
Removed the `emailRedirectTo` parameter from `supabase.auth.signUp()` calls in:
- `/app/auth/sign-up/page.tsx` (line 143-151)
- `/components/registration-popup.tsx` (line 250-258)

This disables Supabase's automatic confirmation email, allowing only the custom Resend verification email to be sent.

## Email Flow After Fix

### Registration Process
1. User submits registration form
2. `supabase.auth.signUp()` creates the user account (no email sent)
3. Profile is updated with `is_host` role flag
4. `/api/resend/send-verification` is called to send **ONE** verification email via Resend
5. User receives **one** branded verification email

### Email Verification Process
1. User clicks verification link in email
2. Request goes to `/api/resend/verify?token=...&email=...`
3. Token is validated against `email_verifications` table
4. User's `email_confirmed_at` is updated in profiles table
5. Welcome email is sent via Resend
6. User is redirected to verification success page

## Files Modified
- `app/auth/sign-up/page.tsx` - Removed `emailRedirectTo` from signUp options
- `components/registration-popup.tsx` - Removed `emailRedirectTo` from signUp options

## Other Registration Routes (No Changes Needed)
The following components still use `emailRedirectTo` and rely on Supabase's default email because they **don't** call the custom Resend endpoint:
- `components/all-spaces-grid.tsx` (line 163)
- `components/search-results.tsx` (line 155)
- `app/space/[id]/page.tsx` (line 328)

These inline registration forms should be updated to match the main registration flow if consistent branding is desired.

## Testing
To verify the fix:
1. Register a new account via the main sign-up page
2. Check email inbox - should receive **only one** verification email
3. Click verification link
4. Should receive **only one** welcome email
5. Total emails received: **2** (1 verification + 1 welcome)

## Related Files
- `/app/api/resend/send-verification/route.ts` - Sends initial verification email
- `/app/api/resend/verify/route.ts` - Handles verification link clicks and sends welcome email
- `/components/emails/verification-email.tsx` - Verification email template
- `/components/emails/welcome-email.tsx` - Welcome email template
- `/lib/resend.ts` - Resend client configuration

## Additional Notes
- The `email_verifications` table tracks all verification tokens with 24-hour expiry
- Tokens are single-use and marked with `verified_at` timestamp after verification
- If Resend is unavailable, the system falls back to Supabase's email service
- Users can resend verification emails via the "Resend Verification Email" button
