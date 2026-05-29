# LinkedIn OAuth Setup Guide

This application uses LinkedIn OAuth via Supabase for user authentication. Follow these steps to configure LinkedIn login.

## Prerequisites

- Supabase project with authentication enabled
- LinkedIn Developer account

## Configuration Steps

### 1. Create LinkedIn OAuth App

1. Go to [LinkedIn Developer Dashboard](https://www.linkedin.com/developers/)
2. Click **"Create App"**
3. Fill in required information:
   - **App name**: SpaceOnGo (or your app name)
   - **LinkedIn Page**: Your company/organization page
   - **App logo**: Upload your logo
4. Click **"Create app"**

### 2. Enable OpenID Connect

1. In your LinkedIn app dashboard, go to **"Products"** tab
2. Find **"Sign In with LinkedIn using OpenID Connect"**
3. Click **"Request access"** (approval is instant)

### 3. Configure Redirect URL

1. Go to **"Auth"** tab in your LinkedIn app
2. Under **"OAuth 2.0 settings"**, find **"Authorized redirect URLs for your app"**
3. Add your Supabase callback URL:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   - Find this URL in: Supabase Dashboard → Authentication → Providers → LinkedIn (OIDC)

### 4. Get LinkedIn Credentials

1. In the **"Auth"** tab, copy:
   - **Client ID**
   - **Client Secret**
2. Save these securely

### 5. Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication → Providers**
4. Find **"LinkedIn (OIDC)"** and expand it
5. Toggle **"LinkedIn (OIDC) Enabled"** to ON
6. Enter your **Client ID** and **Client Secret**
7. Click **"Save"**

## How It Works

### OAuth Flow

1. User clicks "Sign in with LinkedIn" button
2. Application redirects to LinkedIn for authentication
3. User authorizes the app on LinkedIn
4. LinkedIn redirects back to Supabase callback URL
5. Supabase creates/updates user session
6. Application callback handler (`/auth/callback`) processes the response
7. User profile data is synced from LinkedIn to database
8. User is redirected to dashboard

### Profile Data Synced

The following LinkedIn profile data is automatically synced to the user's profile:

- **First Name** (`given_name`)
- **Last Name** (`family_name`)
- **Profile Picture** (`picture`)
- **Email Address** (`email`)

This data is retrieved from LinkedIn's OpenID Connect user info endpoint and stored in the `profiles` table.

## Code Integration

### Login Button Implementation

```typescript
const handleLinkedInLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "linkedin_oidc",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) {
    console.error("LinkedIn login failed:", error)
  }
}
```

### Callback Handler

The `/app/auth/callback/route.ts` automatically:
- Exchanges OAuth code for session
- Detects LinkedIn users via `user.app_metadata.provider === "linkedin_oidc"`
- Syncs profile data to database
- Redirects to appropriate page

## Troubleshooting

### "LinkedIn login failed"
- Verify LinkedIn app is approved for OpenID Connect
- Check redirect URL matches exactly (no trailing slashes)
- Ensure Client ID and Client Secret are correct in Supabase

### "Redirect URI mismatch"
- LinkedIn redirect URL must match Supabase callback URL exactly
- URL format: `https://[project-ref].supabase.co/auth/v1/callback`

### Profile data not syncing
- Check browser console for `[v0]` debug logs
- Verify LinkedIn app has permission to access profile data
- Ensure `profiles` table has proper columns: `first_name`, `last_name`, `profile_image_url`

### User redirected but not logged in
- Check Supabase logs for authentication errors
- Verify session is being created properly
- Ensure cookies are not blocked in browser

## Testing

1. Click "Sign in with LinkedIn" button
2. Authorize the application on LinkedIn
3. Verify redirect back to application
4. Check that profile data appears in dashboard
5. Confirm profile picture and name are displayed

## Security Notes

- Never commit Client Secret to version control
- Use environment variables for sensitive credentials
- LinkedIn only shares data user explicitly authorizes
- User can revoke access at any time from LinkedIn settings
- OAuth tokens are securely managed by Supabase

## Additional Resources

- [Supabase LinkedIn OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-linkedin)
- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [OpenID Connect Specification](https://openid.net/connect/)
