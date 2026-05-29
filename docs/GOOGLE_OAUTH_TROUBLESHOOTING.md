# Google OAuth Troubleshooting Guide

## Overview

This guide provides detailed analysis and solutions for common Google OAuth issues that occur even when the integration appears to be properly configured in the Supabase dashboard.

## Common Issues and Solutions

### 1. Redirect URI Mismatch

**Symptom:** Error message like "redirect_uri_mismatch" or OAuth flow fails after Google login

**Root Cause:** The redirect URI configured in Google Cloud Console doesn't match the one Supabase is using.

**Solution:**

1. **Check Supabase's Redirect URL:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Note the "Site URL" and "Redirect URLs"
   - The OAuth callback URL should be: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

2. **Update Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to: APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", add:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - For local development, also add:
     ```
     http://localhost:3000/auth/callback
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```

3. **Verify in Code:**
   ```typescript
   // The redirectTo in your code should point to YOUR app's callback handler
   const { error } = await supabase.auth.signInWithOAuth({
     provider: "google",
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
     },
   })
   ```

**Important:** The OAuth flow has TWO redirect steps:
- **Step 1:** Google → Supabase (`https://[PROJECT].supabase.co/auth/v1/callback`)
- **Step 2:** Supabase → Your App (`https://your-domain.com/auth/callback`)

Both must be configured correctly!

---

### 2. Client ID or Secret Mismatch

**Symptom:** "invalid_client" error or authentication fails silently

**Root Cause:** The Client ID or Client Secret in Supabase doesn't match the credentials from Google Cloud Console.

**Solution:**

1. **Get Fresh Credentials from Google:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Copy the **Client ID** (should look like: `123456789-abc123.apps.googleusercontent.com`)
   - Click "Download JSON" or view the Client Secret

2. **Update Supabase Configuration:**
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Paste the **exact** Client ID (no extra spaces)
   - Paste the **exact** Client Secret (no extra spaces)
   - Click "Save"

3. **Common Mistakes:**
   - ❌ Using the wrong Client ID (e.g., using a different OAuth client)
   - ❌ Copy-pasting with extra spaces or line breaks
   - ❌ Using an old/revoked Client Secret
   - ❌ Not clicking "Save" after updating

4. **Verification:**
   ```bash
   # Check if the Client ID in Supabase matches Google Console
   # They should be EXACTLY the same
   ```

---

### 3. OAuth Scopes Issues

**Symptom:** User can log in but profile data is missing, or "insufficient permissions" error

**Root Cause:** The OAuth scopes requested don't match what's needed or what's configured.

**Solution:**

1. **Default Scopes (Supabase handles this automatically):**
   - `openid`
   - `email`
   - `profile`

2. **If you need additional scopes:**
   ```typescript
   const { error } = await supabase.auth.signInWithOAuth({
     provider: "google",
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
       scopes: 'openid email profile', // Add custom scopes here
     },
   })
   ```

3. **Verify in Google Cloud Console:**
   - Go to APIs & Services → OAuth consent screen
   - Check that the required scopes are enabled
   - For sensitive scopes, you may need Google verification

---

### 4. Callback Handler Issues

**Symptom:** OAuth succeeds but user gets stuck on loading screen or redirected to wrong page

**Root Cause:** The callback handler at `/auth/callback` isn't working correctly.

**Current Implementation Check:**

```typescript
// File: app/auth/callback/page.tsx
// This handler should:
// 1. Exchange the OAuth code for a session
// 2. Verify the user's email
// 3. Redirect to the appropriate page

export default function AuthCallback() {
  // ... implementation
}
```

**Common Issues:**

1. **Missing Callback Route:**
   - Ensure `app/auth/callback/page.tsx` exists
   - The file must be a client component (`"use client"`)

2. **Not Calling getUser():**
   ```typescript
   // ❌ Wrong - doesn't complete the OAuth flow
   useEffect(() => {
     router.push('/dashboard')
   }, [])

   // ✅ Correct - completes OAuth and gets user
   useEffect(() => {
     const handleCallback = async () => {
       const { data: { user } } = await supabase.auth.getUser()
       if (user) router.push('/dashboard')
     }
     handleCallback()
   }, [])
   ```

3. **Infinite Redirect Loop:**
   - Check that the callback doesn't redirect back to itself
   - Ensure authentication state is properly checked

---

### 5. CORS and Domain Issues

**Symptom:** "CORS policy" error or "Origin not allowed"

**Root Cause:** The domain making the OAuth request isn't authorized.

**Solution:**

1. **Update Supabase URL Configuration:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your domains to "Site URL" and "Redirect URLs":
     ```
     http://localhost:3000
     https://your-production-domain.com
     https://your-preview-domain.vercel.app
     ```

2. **Update Google Cloud Console:**
   - Go to APIs & Services → Credentials → OAuth 2.0 Client ID
   - Under "Authorized JavaScript origins", add:
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```

3. **For Vercel Preview Deployments:**
   - Add wildcard domain: `https://*.vercel.app`
   - Or add each preview URL individually

---

### 6. Development vs Production URL Issues

**Symptom:** OAuth works in development but fails in production (or vice versa)

**Root Cause:** Different URLs between environments aren't properly configured.

**Solution:**

1. **Use Environment Variables:**
   ```typescript
   // ✅ Correct - adapts to environment
   const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
   
   const { error } = await supabase.auth.signInWithOAuth({
     provider: "google",
     options: {
       redirectTo: `${redirectUrl}/auth/callback`,
     },
   })
   ```

2. **Configure Both Environments in Google Console:**
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
   - Staging: `https://staging.your-domain.com`

3. **Supabase URL Configuration:**
   - Set "Site URL" to your production domain
   - Add all environments to "Redirect URLs"

---

### 7. Session Management Issues

**Symptom:** User logs in successfully but session doesn't persist, or user is logged out immediately

**Root Cause:** Session cookies aren't being set or are being cleared.

**Solution:**

1. **Check Middleware Configuration:**
   ```typescript
   // File: middleware.ts
   import { createServerClient } from '@supabase/ssr'
   
   export async function middleware(request: NextRequest) {
     const response = NextResponse.next()
     
     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get(name: string) {
             return request.cookies.get(name)?.value
           },
           set(name: string, value: string, options: CookieOptions) {
             response.cookies.set({ name, value, ...options })
           },
           remove(name: string, options: CookieOptions) {
             response.cookies.set({ name, value: '', ...options })
           },
         },
       }
     )
     
     await supabase.auth.getUser()
     return response
   }
   ```

2. **Cookie Domain Issues:**
   - Ensure cookies are set for the correct domain
   - Check browser DevTools → Application → Cookies
   - Look for `sb-[project-ref]-auth-token`

3. **Third-Party Cookie Blocking:**
   - Some browsers block third-party cookies
   - Ensure your app and Supabase are on compatible domains
   - Consider using a custom domain for Supabase

---

### 8. Network and Firewall Issues

**Symptom:** OAuth request times out or fails to connect

**Root Cause:** Network restrictions blocking OAuth requests.

**Solution:**

1. **Check Firewall Rules:**
   - Ensure outbound HTTPS (port 443) is allowed
   - Whitelist Google OAuth domains:
     - `accounts.google.com`
     - `oauth2.googleapis.com`
   - Whitelist Supabase domain:
     - `[YOUR-PROJECT-REF].supabase.co`

2. **Corporate Network Issues:**
   - Some corporate networks block OAuth
   - Test on a different network (mobile hotspot)
   - Contact IT to whitelist required domains

3. **VPN/Proxy Issues:**
   - Disable VPN temporarily to test
   - Configure proxy to allow OAuth domains

---

## Debugging Checklist

When Google OAuth is "configured" but still failing, check these in order:

### ✅ Google Cloud Console Configuration

- [ ] OAuth 2.0 Client ID is created
- [ ] Client ID and Secret are copied correctly (no spaces)
- [ ] Authorized JavaScript origins include your domain
- [ ] Authorized redirect URIs include Supabase callback URL
- [ ] OAuth consent screen is configured
- [ ] Required scopes are enabled

### ✅ Supabase Configuration

- [ ] Google provider is enabled in Authentication → Providers
- [ ] Client ID matches Google Console exactly
- [ ] Client Secret matches Google Console exactly
- [ ] Site URL is set to your production domain
- [ ] Redirect URLs include all your domains
- [ ] Email confirmations are configured (if required)

### ✅ Application Code

- [ ] Callback handler exists at `/auth/callback`
- [ ] Callback handler calls `supabase.auth.getUser()`
- [ ] redirectTo URL is correct in signInWithOAuth
- [ ] Environment variables are set correctly
- [ ] Middleware is configured for session management

### ✅ Browser/Network

- [ ] Cookies are enabled
- [ ] Third-party cookies are allowed (or not required)
- [ ] No browser extensions blocking OAuth
- [ ] Network allows HTTPS to Google and Supabase
- [ ] No CORS errors in browser console

---

## Testing OAuth Flow

### Step-by-Step Test:

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Click "Sign in with Google"**
4. **Watch the network requests:**

   ```
   Expected flow:
   1. POST to Supabase: /auth/v1/authorize
   2. Redirect to: accounts.google.com/o/oauth2/v2/auth
   3. User logs in to Google
   4. Redirect to: [PROJECT].supabase.co/auth/v1/callback
   5. Redirect to: your-domain.com/auth/callback
   6. Final redirect to: your-domain.com/dashboard
   ```

5. **Check for errors at each step**
6. **Look at Console tab for error messages**

### Debug Logging:

Add console logs to track the OAuth flow:

```typescript
const handleGoogleLogin = async () => {
  console.log('[v0] Starting Google OAuth flow')
  console.log('[v0] Redirect URL:', `${window.location.origin}/auth/callback`)
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    console.log('[v0] OAuth response:', { data, error })
    
    if (error) {
      console.error('[v0] OAuth error:', error.message, error.status)
      throw error
    }
  } catch (error) {
    console.error('[v0] Caught error:', error)
  }
}
```

---

## Common Error Messages and Solutions

### "redirect_uri_mismatch"
**Solution:** Add Supabase callback URL to Google Console authorized redirect URIs

### "invalid_client"
**Solution:** Verify Client ID and Secret match between Google Console and Supabase

### "access_denied"
**Solution:** User cancelled login or doesn't have permission. Check OAuth consent screen configuration.

### "Unsupported provider: provider is not enabled"
**Solution:** Enable Google provider in Supabase Dashboard → Authentication → Providers

### "Origin not allowed"
**Solution:** Add your domain to Supabase URL Configuration and Google Console authorized origins

### "Failed to fetch"
**Solution:** Network issue - check firewall, VPN, or CORS configuration

---

## Still Having Issues?

If you've checked everything above and OAuth still isn't working:

1. **Check Supabase Status:** https://status.supabase.com/
2. **Review Supabase Logs:** Dashboard → Logs → Auth Logs
3. **Test with a Different Provider:** Try Facebook OAuth to isolate Google-specific issues
4. **Create a Minimal Test:** Test OAuth in a fresh Next.js project
5. **Contact Support:** Provide error messages, network logs, and configuration details

---

## Security Best Practices

1. **Never commit OAuth credentials to version control**
2. **Use environment variables for all sensitive data**
3. **Rotate Client Secrets periodically**
4. **Monitor OAuth usage in Google Console**
5. **Implement rate limiting on auth endpoints**
6. **Use HTTPS in production (required for OAuth)**
7. **Validate user data after OAuth login**
8. **Implement CSRF protection**

---

## Additional Resources

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
