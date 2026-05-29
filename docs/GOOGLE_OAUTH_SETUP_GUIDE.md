# Google OAuth Integration Guide

This guide provides comprehensive instructions for integrating Google OAuth login into the SpaceOnGo application using Supabase authentication.

## Table of Contents

1. [Overview](#overview)
2. [Google Developer Console Setup](#google-developer-console-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Application Implementation](#application-implementation)
5. [OAuth Flow Sequence](#oauth-flow-sequence)
6. [Security Considerations](#security-considerations)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Google OAuth 2.0 allows users to sign in to SpaceOnGo using their Google account credentials. This implementation uses Supabase's built-in OAuth provider support, which handles:

- OAuth token exchange
- Session management
- User profile retrieval
- Secure token storage

**Benefits:**
- Simplified user registration and login
- No password management required
- Trusted authentication provider
- Automatic profile information retrieval

---

## Google Developer Console Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `SpaceOnGo` (or your preferred name)
4. Click **"Create"**

### Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Navigate to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (or "Internal" if using Google Workspace)
3. Click **"Create"**

**Fill in the required information:**

- **App name:** SpaceOnGo
- **User support email:** your-email@example.com
- **App logo:** (Optional) Upload your app logo
- **Application home page:** https://your-domain.com
- **Application privacy policy link:** https://your-domain.com/privacy
- **Application terms of service link:** https://your-domain.com/terms
- **Authorized domains:** 
  - your-domain.com
  - your-supabase-project.supabase.co
- **Developer contact information:** your-email@example.com

4. Click **"Save and Continue"**

### Step 4: Configure Scopes

1. Click **"Add or Remove Scopes"**
2. Select the following scopes:
   - `openid` - Required for OAuth 2.0
   - `email` - User's email address
   - `profile` - User's basic profile information (name, picture)

3. Click **"Update"** → **"Save and Continue"**

### Step 5: Add Test Users (Development Only)

If your app is in testing mode:

1. Click **"Add Users"**
2. Enter email addresses of users who can test the OAuth flow
3. Click **"Save and Continue"**

### Step 6: Create OAuth 2.0 Credentials

1. Navigate to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**

**Configure the OAuth client:**

- **Name:** SpaceOnGo Web Client
- **Authorized JavaScript origins:**
  - `http://localhost:3000` (for local development)
  - `https://your-domain.com` (for production)
  - `https://your-preview-url.vercel.app` (for Vercel previews)

- **Authorized redirect URIs:**
  - `http://localhost:54321/auth/v1/callback` (for local Supabase)
  - `https://your-project.supabase.co/auth/v1/callback` (for production Supabase)

4. Click **"Create"**
5. **Save the Client ID and Client Secret** - you'll need these for Supabase configuration

---

## Supabase Configuration

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **"Authentication"** → **"Providers"**

### Step 2: Enable Google Provider

1. Find **"Google"** in the list of providers
2. Toggle **"Enable Sign in with Google"** to ON

### Step 3: Configure Google OAuth

Enter the credentials from Google Developer Console:

- **Client ID:** `your-google-client-id.apps.googleusercontent.com`
- **Client Secret:** `your-google-client-secret`

### Step 4: Configure Redirect URLs

Supabase automatically handles the redirect URL. The format is:
```
https://your-project.supabase.co/auth/v1/callback
```

Make sure this URL is added to your Google OAuth client's authorized redirect URIs.

### Step 5: Save Configuration

Click **"Save"** to apply the changes.

---

## Application Implementation

The application already has Google OAuth implemented. Here's how it works:

### Frontend Implementation

**Location:** `components/all-spaces-grid.tsx`

```typescript
const handleGoogleLogin = async () => {
  setIsLoggingIn(true)
  setLoginError(null)

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }
  } catch (error: unknown) {
    setLoginError(error instanceof Error ? error.message : "Google login failed. Please try again.")
    setIsLoggingIn(false)
  }
}
```

### OAuth Callback Handler

**Location:** `app/auth/callback/page.tsx`

The callback handler processes the OAuth response from Google and establishes the user session.

```typescript
// Simplified example
const supabase = createClient()
const { data: { session }, error } = await supabase.auth.getSession()

if (session) {
  // User is authenticated
  // Redirect to dashboard or intended destination
  router.push('/dashboard')
} else {
  // Handle error
  router.push('/auth/error')
}
```

---

## OAuth Flow Sequence

### 1. User Initiates Login

```
User clicks "Sign in with Google" button
  ↓
Application calls handleGoogleLogin()
  ↓
Supabase SDK initiates OAuth flow
```

### 2. Redirect to Google

```
User is redirected to Google's OAuth consent screen
  ↓
URL: https://accounts.google.com/o/oauth2/v2/auth
  ↓
Parameters:
  - client_id: Your Google Client ID
  - redirect_uri: https://your-project.supabase.co/auth/v1/callback
  - response_type: code
  - scope: openid email profile
  - state: Random security token
```

### 3. User Grants Permission

```
User reviews requested permissions
  ↓
User clicks "Allow"
  ↓
Google generates authorization code
```

### 4. Google Redirects to Supabase

```
Google redirects to: https://your-project.supabase.co/auth/v1/callback
  ↓
Parameters:
  - code: Authorization code
  - state: Security token (validated)
```

### 5. Supabase Exchanges Code for Tokens

```
Supabase backend exchanges authorization code for tokens
  ↓
POST https://oauth2.googleapis.com/token
  ↓
Body:
  - code: Authorization code
  - client_id: Your Client ID
  - client_secret: Your Client Secret
  - redirect_uri: Callback URL
  - grant_type: authorization_code
  ↓
Response:
  - access_token: OAuth access token
  - refresh_token: OAuth refresh token
  - id_token: JWT with user info
  - expires_in: Token expiration time
```

### 6. Supabase Retrieves User Profile

```
Supabase uses access_token to fetch user profile
  ↓
GET https://www.googleapis.com/oauth2/v2/userinfo
  ↓
Response:
  - id: Google user ID
  - email: User's email
  - name: User's full name
  - picture: Profile picture URL
  - verified_email: Email verification status
```

### 7. Supabase Creates/Updates User

```
Supabase checks if user exists in auth.users table
  ↓
If new user:
  - Create user record
  - Create profile record
  - Link Google identity
  ↓
If existing user:
  - Update last sign in
  - Refresh user metadata
```

### 8. Session Establishment

```
Supabase creates session
  ↓
Generates JWT access token
  ↓
Sets secure HTTP-only cookies:
  - sb-access-token
  - sb-refresh-token
```

### 9. Redirect to Application

```
Supabase redirects to: https://your-domain.com/auth/callback
  ↓
Application callback handler:
  - Validates session
  - Extracts user data
  - Redirects to dashboard or intended page
```

---

## Security Considerations

### 1. State Parameter Validation

The `state` parameter prevents CSRF attacks:

```typescript
// Supabase automatically handles state generation and validation
// The state is a random string that's verified on callback
```

### 2. Secure Token Storage

- **Access tokens** are stored in HTTP-only cookies (not accessible via JavaScript)
- **Refresh tokens** are securely stored and used to obtain new access tokens
- Tokens are encrypted in transit (HTTPS only)

### 3. Redirect URI Validation

- Only whitelisted redirect URIs are accepted
- Exact match required (no wildcards)
- Must use HTTPS in production

### 4. Scope Limitation

Request only necessary scopes:
- `openid` - Required for OAuth 2.0
- `email` - User's email address
- `profile` - Basic profile information

**Do NOT request:**
- Unnecessary Google services access
- Sensitive data scopes
- Offline access (unless specifically needed)

### 5. Token Expiration

- Access tokens expire after 1 hour
- Refresh tokens are used to obtain new access tokens
- Supabase automatically handles token refresh

### 6. PKCE (Proof Key for Code Exchange)

Supabase implements PKCE for additional security:
- Prevents authorization code interception attacks
- Uses code_challenge and code_verifier
- Automatically handled by Supabase SDK

### 7. Environment Variables

Store sensitive credentials securely:

```bash
# .env.local (never commit to version control)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 8. Content Security Policy

Add Google domains to your CSP:

```typescript
// next.config.js
const cspHeader = `
  connect-src 'self' https://accounts.google.com https://*.supabase.co;
  frame-src 'self' https://accounts.google.com;
`
```

---

## Error Handling

### Common Errors and Solutions

#### 1. "redirect_uri_mismatch"

**Error:** The redirect URI in the request doesn't match the authorized redirect URIs.

**Solution:**
- Verify redirect URI in Google Console matches exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

#### 2. "access_denied"

**Error:** User denied permission or closed the consent screen.

**Solution:**
```typescript
const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('access_denied')) {
        setLoginError("You need to grant permission to sign in with Google.")
      } else {
        setLoginError(error.message)
      }
    }
  } catch (error) {
    console.error('[v0] Google OAuth error:', error)
    setLoginError("An unexpected error occurred. Please try again.")
  }
}
```

#### 3. "invalid_client"

**Error:** Client ID or Client Secret is incorrect.

**Solution:**
- Verify credentials in Supabase dashboard
- Regenerate credentials if necessary
- Check for extra spaces or characters

#### 4. "unauthorized_client"

**Error:** Client is not authorized for this grant type.

**Solution:**
- Ensure OAuth client type is "Web application"
- Verify authorized redirect URIs are configured

#### 5. Session Errors

**Error:** Session not established after OAuth callback.

**Solution:**
```typescript
// app/auth/callback/page.tsx
export default async function AuthCallback() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[v0] Session error:', error)
      redirect('/auth/error?message=' + encodeURIComponent(error.message))
    }
    
    if (!session) {
      console.error('[v0] No session found')
      redirect('/auth/error?message=No session established')
    }
    
    // Success - redirect to dashboard
    redirect('/dashboard')
  } catch (error) {
    console.error('[v0] Callback error:', error)
    redirect('/auth/error')
  }
}
```

### Error Logging

Implement comprehensive error logging:

```typescript
const handleGoogleLogin = async () => {
  try {
    console.log('[v0] Initiating Google OAuth')
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('[v0] Google OAuth error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      throw error
    }
    
    console.log('[v0] Google OAuth initiated successfully')
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    // Show user-friendly error message
    setLoginError("Unable to sign in with Google. Please try again.")
  }
}
```

---

## Testing

### Local Development Testing

1. **Start local development server:**
   ```bash
   npm run dev
   ```

2. **Test OAuth flow:**
   - Navigate to http://localhost:3000
   - Click "Sign in with Google"
   - Verify redirect to Google consent screen
   - Grant permissions
   - Verify redirect back to application
   - Check that session is established

3. **Verify user data:**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('User:', user)
   // Should include: email, user_metadata (name, avatar_url)
   ```

### Production Testing

1. **Deploy to production**
2. **Update Google OAuth redirect URIs** with production URL
3. **Test complete OAuth flow** in production environment
4. **Monitor error logs** for any issues

### Test Checklist

- [ ] User can initiate Google OAuth
- [ ] Redirect to Google consent screen works
- [ ] User can grant permissions
- [ ] Callback handler processes response correctly
- [ ] Session is established successfully
- [ ] User data is retrieved and stored
- [ ] Profile is created/updated in database
- [ ] User is redirected to correct page
- [ ] Error handling works for denied permissions
- [ ] Error handling works for network issues
- [ ] Logout functionality works correctly
- [ ] Token refresh works automatically

---

## Troubleshooting

### Issue: OAuth popup blocked

**Solution:** Ensure OAuth is triggered by user interaction (click event), not automatically.

### Issue: Infinite redirect loop

**Solution:** 
- Check callback handler logic
- Verify redirect URLs don't create loops
- Clear browser cookies and try again

### Issue: User data not saved to profiles table

**Solution:**
- Check database triggers
- Verify RLS policies allow inserts
- Check Supabase logs for errors

### Issue: "Email already registered" error

**Solution:**
- User may have registered with email/password first
- Implement account linking functionality
- Or prompt user to sign in with original method

### Debug Mode

Enable debug logging:

```typescript
// Add to your OAuth handler
console.log('[v0] OAuth Debug Info:', {
  provider: 'google',
  redirectTo: window.location.origin + '/auth/callback',
  currentUrl: window.location.href,
  timestamp: new Date().toISOString(),
})
```

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Review browser console for errors
3. Verify Google Cloud Console configuration
4. Test with a different Google account
5. Contact support with error details and logs
