# OAuth Social Login Troubleshooting Guide

## Issue: Infinite Spinning on Google Sign-In

### Symptoms
- Social login buttons (Google/Facebook/LinkedIn) spin indefinitely
- User cannot select Gmail account  
- No error messages displayed
- Browser appears to be waiting for a response

---

## Root Causes & Solutions

### 1. **Supabase OAuth Configuration** ⚠️ MOST COMMON

**Problem**: Redirect URLs not properly configured in Supabase dashboard

**Check**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Verify "Site URL" is set to your production domain
3. Verify "Redirect URLs" includes:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

**Fix**:
```
Site URL: https://yourdomain.com
Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://yourdomain.com/auth/callback
```

### 2. **Google OAuth Console Configuration**

**Problem**: Authorized redirect URIs don't match Supabase callback URL

**Check**:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Select your OAuth 2.0 Client ID
3. Check "Authorized redirect URIs"

**Fix**:
Add Supabase's OAuth callback URL:
```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

**Find your project ref**: 
- In Supabase dashboard URL: `https://supabase.com/dashboard/project/[PROJECT-REF]`
- Or from your `NEXT_PUBLIC_SUPABASE_URL`: `https://[PROJECT-REF].supabase.co`

### 3. **Missing OAuth Provider Setup in Supabase**

**Problem**: Google provider not enabled in Supabase

**Check**:
1. Supabase Dashboard → Authentication → Providers
2. Verify Google is enabled
3. Verify Client ID and Client Secret are set

**Fix**:
1. Enable Google provider
2. Add your Google OAuth Client ID
3. Add your Google OAuth Client Secret
4. Save settings

### 4. **CORS and Cookie Issues**

**Problem**: Third-party cookies blocked by browser

**Check**:
- Browser console for CORS errors
- Check if browser blocks third-party cookies

**Fix**:
- Use Supabase pkce flow (already implemented)
- Test in different browsers
- Check browser privacy settings

### 5. **Callback Handler Issues**

**Problem**: `/auth/callback` route not handling OAuth response correctly

**Current Implementation Issues**:
- Missing Facebook provider in OAuth user check
- Profile sync errors not reported to user
- No timeout handling for OAuth flow

**Fix**: See code changes below

---

## Debugging Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) and check for:

```
Expected success logs:
[v0] Initiating Google OAuth registration
[v0] OAuth login successful for user: [user-id]
[v0] Updating profile with OAuth data

Error patterns to look for:
- "Failed to fetch"
- "CORS error"
- "Invalid redirect URI"
- "OAuth error"
```

### Step 2: Check Network Tab

1. Open Network tab in DevTools
2. Click Google sign-in button
3. Look for requests to:
   - `supabase.co/auth/v1/authorize`
   - `accounts.google.com/oauth`
   - `/auth/callback`

**Check for**:
- Requests stuck in "pending" status
- 400/401/403 errors
- Redirect loops

### Step 3: Verify Environment Variables

```bash
# Check these are set correctly:
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Step 4: Test OAuth Flow Manually

```typescript
// Add to browser console while on your site:
const supabase = window.Cypress?.env('supabase') || 
                (await import('@/lib/supabase/client')).createClient()

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

console.log('OAuth result:', { data, error })
```

---

## Common Error Messages

### "Invalid login credentials"
- Google account created but not in your database
- Run profile sync on first login
- Check callback handler creates profile correctly

### "Failed to exchange code for session"
- Redirect URI mismatch
- Check Supabase and Google Console settings match

### "User already exists"  
- Email already registered with email/password
- Suggest using password reset or different provider

### Infinite redirect loop
- Callback URL redirects back to login
- Check authentication state in callback handler

---

## Testing Checklist

- [ ] Test Google OAuth in incognito window
- [ ] Test with different Google account
- [ ] Test Facebook OAuth
- [ ] Test LinkedIn OAuth
- [ ] Verify profile data syncs correctly
- [ ] Verify role selection works for new users
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Check OAuth works in production environment

---

## Production Deployment Checklist

Before deploying:

1. **Update Supabase URLs**:
   ```
   Site URL: https://your-production-domain.com
   Redirect URLs: 
     - https://your-production-domain.com/auth/callback
   ```

2. **Update Google OAuth Console**:
   ```
   Authorized redirect URIs:
     - https://[project-ref].supabase.co/auth/v1/callback
   Authorized JavaScript origins:
     - https://your-production-domain.com
   ```

3. **Update Environment Variables**:
   ```
   NEXT_PUBLIC_APP_URL=https://your-production-domain.com
   NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
   ```

4. **Test OAuth in production** before announcing to users

---

## Quick Fixes

### Reset OAuth State
```bash
# Clear browser storage
localStorage.clear()
sessionStorage.clear()

# Clear cookies for your domain
# Use browser DevTools → Application → Cookies
```

### Force Profile Sync
```sql
-- Run in Supabase SQL Editor
UPDATE profiles 
SET first_name = NULL, profile_image_url = NULL
WHERE id = '[user-id]';

-- User's next login will re-sync OAuth data
```

---

## Need Help?

1. Check Supabase Auth logs: Dashboard → Logs → Auth Logs
2. Enable debug mode in your app
3. Test with Supabase CLI: `supabase auth list users`
4. Contact Supabase support with:
   - Project reference
   - Timestamp of failed attempt
   - Browser console logs
   - Network request details
