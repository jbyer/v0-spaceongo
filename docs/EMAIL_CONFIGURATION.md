# Email Configuration - Supabase Only

## Overview

The SpaceOnGo platform uses **Supabase's built-in email service exclusively** for all user verification emails during registration. This ensures a streamlined, single-source email delivery system without duplication.

## Registration Flow

When a new user registers:

1. User submits registration form
2. `supabase.auth.signUp()` is called **with `emailRedirectTo` parameter**
3. Supabase automatically sends ONE verification email
4. User clicks verification link in email
5. User is redirected to `/auth/callback` and account is activated

## Implementation Details

### All Registration Entry Points

The following files have been updated to use Supabase emails only:

1. **Main Sign-Up Page**: `app/auth/sign-up/page.tsx`
2. **Registration Popup**: `components/registration-popup.tsx`
3. **All Spaces Grid**: `components/all-spaces-grid.tsx`
4. **Search Results**: `components/search-results.tsx`
5. **Space Detail Page**: `app/space/[id]/SpaceDetailPageClient.tsx`

### Code Pattern

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    // This parameter triggers Supabase's automatic verification email
    emailRedirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin}/auth/callback`,
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
    },
  },
})

// Supabase handles email sending automatically - no additional API calls needed
```

## Environment Variables

The system uses the following environment variable for email redirects:

- **Development**: `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (if set)
- **Production**: `window.location.origin` (fallback)

This ensures emails work correctly in both local development and production environments.

## Email Customization

To customize the Supabase verification email template:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Email Templates
3. Customize the "Confirm signup" template
4. Available variables: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`

## Benefits of Supabase-Only Emails

1. **No Duplication**: Users receive exactly ONE verification email
2. **Simplified Architecture**: No need for separate email service integration
3. **Built-in Reliability**: Supabase handles email delivery and retries
4. **Consistent Experience**: All emails come from the same source
5. **Zero Configuration**: Works out of the box with Supabase setup

## Troubleshooting

If users aren't receiving verification emails:

1. Check Supabase Dashboard → Authentication → Email Templates are enabled
2. Verify SMTP settings in Supabase project settings
3. Check spam/junk folders
4. Ensure email redirectTo URL is whitelisted in Supabase settings
5. Review Supabase logs for email delivery failures

## Migration Notes

This configuration replaces the previous dual-email system that used both Supabase and Resend. All Resend API calls have been removed from the registration flows to prevent duplicate emails.
