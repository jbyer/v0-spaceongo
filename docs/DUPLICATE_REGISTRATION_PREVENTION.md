# Duplicate Registration Prevention

## Overview
This document explains how the application prevents users from registering multiple accounts with the same email address across all registration entry points.

## Problem Statement
Users were able to register multiple times with the same email address because:
1. Some registration forms lacked email validation checks
2. Supabase Auth allows creating multiple auth users with the same email (by design)
3. Only the profiles table has a unique constraint on the email field

## Solution Architecture

### Email Validation Flow
1. **Client-Side Validation** (Real-time feedback)
   - Email format validation using regex
   - Debounced email availability check (500ms delay)
   - Visual feedback with loading spinner and success/error icons

2. **Server-Side Validation** (Security & data integrity)
   - API endpoint `/api/auth/check-email` validates email availability
   - Checks the `profiles` table for existing email addresses
   - Returns `exists: true/false` with appropriate message

3. **Registration Prevention**
   - If email exists, registration is blocked before calling `supabase.auth.signUp()`
   - Clear error message: "An account with this email already exists. Please sign in instead."
   - User is redirected to sign in instead of creating duplicate account

### Implementation Coverage

All 5 registration entry points now include email validation:

1. **Main Sign-Up Page** (`/app/auth/sign-up/page.tsx`)
   - ✅ Real-time email validation with debouncing
   - ✅ Server-side check via `/api/auth/check-email`
   - ✅ Visual feedback (spinner, checkmark, error)
   - ✅ Blocks registration if email exists

2. **Registration Popup** (`/components/registration-popup.tsx`)
   - ✅ Real-time email validation with debouncing
   - ✅ Server-side check via `/api/auth/check-email`
   - ✅ Visual feedback (spinner, checkmark, error)
   - ✅ Blocks registration if email exists

3. **All Spaces Grid** (`/components/all-spaces-grid.tsx`)
   - ✅ Added `checkEmailExists()` function
   - ✅ Server-side validation before signup
   - ✅ Error message if email exists
   - ✅ Removed `emailRedirectTo` to prevent duplicate emails

4. **Search Results** (`/components/search-results.tsx`)
   - ✅ Added `checkEmailExists()` function
   - ✅ Server-side validation before signup
   - ✅ Error message if email exists
   - ✅ Removed `emailRedirectTo` to prevent duplicate emails

5. **Space Detail Page** (`/app/space/[id]/page.tsx`)
   - ✅ Added `checkEmailExists()` function
   - ✅ Server-side validation before signup
   - ✅ Error message if email exists
   - ✅ Removed `emailRedirectTo` to prevent duplicate emails

### Database Layer Protection

**Profiles Table Constraint:**
```sql
ALTER TABLE profiles
ADD CONSTRAINT profiles_email_unique UNIQUE (email);
```

This ensures database-level uniqueness even if application-level validation fails.

### Verification Email Consistency

All registration routes now:
- ❌ Removed `emailRedirectTo` parameter (disables Supabase auto-email)
- ✅ Call `/api/resend/send-verification` (sends ONE custom-branded email)
- ✅ Consistent user experience across all registration flows

## API Endpoint

### `/api/auth/check-email`

**Request:**
```json
POST /api/auth/check-email
{
  "email": "user@example.com"
}
```

**Response (Email Available):**
```json
{
  "exists": false,
  "available": true,
  "message": "Email is available"
}
```

**Response (Email Exists):**
```json
{
  "exists": true,
  "available": false,
  "message": "An account with this email already exists"
}
```

## Error Handling

### User-Friendly Messages
- **Email exists:** "An account with this email already exists. Please sign in instead."
- **Network error:** Gracefully degrades, logs error, allows retry
- **Invalid email format:** "Please enter a valid email address"

### Logging
All email checks are logged with `[v0]` prefix for debugging:
```javascript
console.log("[v0] Checking email availability:", email)
console.log("[v0] Email check result:", data)
console.error("[v0] Email check failed:", error)
```

## Testing

### Manual Testing Steps
1. Register a new account with email `test@example.com`
2. Try to register again with same email on each entry point:
   - Main sign-up page
   - Registration popup
   - All spaces grid (favorites modal)
   - Search results (booking modal)
   - Space detail page (booking/favorite modals)
3. Verify error message appears: "An account with this email already exists"
4. Verify registration is blocked before auth call
5. Verify only ONE verification email is received

### Edge Cases Handled
- **Case sensitivity:** Emails are normalized to lowercase before checking
- **Whitespace:** Email is trimmed before validation
- **Network failures:** Graceful degradation with console logging
- **Race conditions:** Debounced validation prevents excessive API calls
- **Invalid email format:** Validated before making API call

## Security Considerations

1. **Server-Side Validation:** Email availability check happens on server to prevent bypass
2. **Rate Limiting:** Consider adding rate limiting to `/api/auth/check-email` endpoint
3. **CSRF Protection:** API uses Next.js built-in CSRF protection
4. **Database Constraint:** Unique constraint on `profiles.email` provides final safety net

## Related Files
- `/app/api/auth/check-email/route.ts` - Email validation API
- `/app/auth/sign-up/page.tsx` - Main registration page
- `/components/registration-popup.tsx` - Popup registration
- `/components/all-spaces-grid.tsx` - Inline registration (spaces grid)
- `/components/search-results.tsx` - Inline registration (search)
- `/app/space/[id]/page.tsx` - Inline registration (space detail)
- `/docs/DUPLICATE_EMAIL_FIX.md` - Duplicate email prevention

## Future Enhancements
- Add rate limiting to email check API
- Implement email verification requirement before full account activation
- Add "Forgot Password" link when duplicate email is detected
- Consider OAuth provider linking for users with same email
