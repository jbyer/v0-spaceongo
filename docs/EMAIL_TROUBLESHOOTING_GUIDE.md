# Email Confirmation Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting steps for diagnosing and resolving issues with account confirmation emails not being sent during user registration. This application uses **Resend** for verification emails with Supabase as a fallback.

---

## Quick Diagnostic Checklist

Run the diagnostic script first:
```bash
npm run diagnose:email
# or
node scripts/diagnose_email_configuration.ts
```

---

## 1. Supabase Dashboard Configuration

### Email Authentication Settings

**Location:** Supabase Dashboard → Authentication → Providers → Email

#### Required Settings:
- ✅ **Enable Email Provider**: Must be ON
- ✅ **Confirm Email**: Must be ENABLED
- ✅ **Secure Email Change**: Recommended ON

#### How to Verify:
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Ensure "Confirm email" toggle is **enabled**

**Common Issue:** If "Confirm email" is disabled, users will be automatically confirmed without receiving an email.

---

## 2. Email Templates Configuration

### Confirm Signup Template

**Location:** Supabase Dashboard → Authentication → Email Templates → Confirm signup

#### Template Requirements:
- Must include `{{ .ConfirmationURL }}` variable
- Should have clear call-to-action button/link
- Must be saved and published

#### Default Template Check:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

#### How to Verify:
1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Verify the template contains `{{ .ConfirmationURL }}`
4. Click **Save** if you made changes

---

## 3. Resend Email Service Configuration (Primary)

This application uses **Resend** as the primary email service for sending verification emails. Resend provides reliable email delivery with detailed logging and analytics.

### Required Environment Variables

```env
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_REPLY_TO=support@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 1: Get Your Resend API Key

1. Go to [resend.com](https://resend.com) and create an account
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Copy the key (starts with `re_`)
5. Add it to your environment variables as `RESEND_API_KEY`

### Step 2: Domain Verification (Production)

**For Production Use:**
1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the provided DNS records to your domain registrar:
   - **SPF Record**: TXT record for sender authentication
   - **DKIM Record**: TXT record for email signing
   - **DMARC Record**: TXT record for email policy (optional but recommended)
5. Wait for DNS propagation (up to 48 hours, usually faster)
6. Verify the domain in Resend dashboard

**For Development/Testing:**
Use Resend's test domain (no verification needed):
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Step 3: Check Rate Limits

**Resend Free Tier Limits:**
- 100 emails per day
- 3,000 emails per month
- For higher volumes, upgrade to a paid plan

### Common Resend Issues

#### Issue 1: API Key Invalid or Revoked

**Symptoms:**
- Error: "Invalid API key"
- Status 401 in logs

**Solutions:**
1. Check if API key starts with `re_`
2. Verify key is not revoked in Resend dashboard
3. Generate a new API key if needed
4. Update environment variables
5. Restart your application

#### Issue 2: Domain Not Verified

**Symptoms:**
- Emails not sending from custom domain
- Error: "Domain not verified"

**Solutions:**
1. Use `onboarding@resend.dev` for immediate testing
2. Verify DNS records are correctly added
3. Wait for DNS propagation (check with `dig` or `nslookup`)
4. Confirm verification in Resend dashboard
5. Update `RESEND_FROM_EMAIL` after verification

#### Issue 3: Rate Limit Exceeded

**Symptoms:**
- Error: "Rate limit exceeded"
- Emails stop sending after several attempts

**Solutions:**
1. Check Resend dashboard for usage statistics
2. Wait for rate limit reset (daily/monthly)
3. Use different test emails sparingly
4. Upgrade to paid plan if needed for production

#### Issue 4: Emails Landing in Spam

**Symptoms:**
- Emails delivered but in spam folder
- Low delivery rate

**Solutions:**
1. Complete domain verification with SPF/DKIM/DMARC
2. Use a verified custom domain instead of test domain
3. Avoid spam trigger words in email content
4. Maintain good sender reputation
5. Ask recipients to whitelist your domain

### Testing Resend Configuration

Visit the diagnostic page to test your Resend setup:
- **URL**: `/admin/email-diagnostics`
- **Features**:
  - Check API key validity
  - Verify environment variables
  - Send test emails
  - View configuration status
  - Get troubleshooting recommendations

### Resend Dashboard Monitoring

**Location**: [resend.com/emails](https://resend.com/emails)

**What to Monitor:**
- Email delivery status (delivered, bounced, failed)
- Open rates and click rates
- Error messages and logs
- API usage and rate limits
- Domain health score

### Fallback to Supabase

If Resend is not configured or fails, the application automatically falls back to Supabase's built-in email service:

```typescript
// Automatic fallback logic in code
if (!resend) {
  console.log("[v0] Resend unavailable, using Supabase email service")
  // Uses Supabase auth email instead
}
```

**Indicators of Fallback:**
- Check browser console for `[v0]` logs
- Sign-up success page shows "verification email sent"
- Email comes from `noreply@mail.app.supabase.io` instead of custom domain

---

## 4. Supabase SMTP Configuration (Fallback)

### Default Supabase Email Service

**For Development:**
- Supabase provides a default email service
- Emails sent from: `noreply@mail.app.supabase.io`
- **Limitation:** May be rate-limited or filtered as spam

### Custom SMTP (Production Recommended)

**Location:** Supabase Dashboard → Project Settings → Auth → SMTP Settings

#### Required Fields:
- **SMTP Host**: Your email provider's SMTP server
- **SMTP Port**: Usually 587 (TLS) or 465 (SSL)
- **SMTP User**: Your email account username
- **SMTP Password**: Your email account password
- **Sender Email**: The "from" address for emails
- **Sender Name**: Display name for emails

#### Popular SMTP Providers:
- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.region.amazonaws.com:587
- **Gmail**: smtp.gmail.com:587 (requires app password)

#### How to Configure:
1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Enable Custom SMTP**
4. Fill in your SMTP provider details
5. Click **Save**
6. Send a test email to verify

---

## 4. Environment Variables

### Required Variables

```env
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Redirect (Development)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_REPLY_TO=support@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Optional SMTP Variables (if using custom SMTP)

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### How to Verify:
1. Check your `.env.local` file (development)
2. Check your deployment platform's environment variables (production)
3. Run the diagnostic script to verify all variables are loaded

---

## 5. Application Code Verification

### Sign-up Implementation with Resend

**File:** `app/auth/sign-up/page.tsx`

#### Key Code Flow:

```typescript
// 1. Create user in Supabase
const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    // ✅ CRITICAL: emailRedirectTo must be set
    emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL 
      || `${window.location.origin}/auth/callback`,
    
    // ✅ User metadata for profile creation
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
    },
  },
})

// 2. Send verification email via Resend
const emailResponse = await fetch("/api/resend/send-verification", {
  method: "POST",
  body: JSON.stringify({
    email: email.trim(),
    firstName: firstName.trim(),
    userId: data.user.id,
  }),
})
```

#### Verification Email API

**File:** `app/api/resend/send-verification/route.ts`

**What it does:**
1. Validates email format and required fields
2. Generates secure 32-byte verification token
3. Stores token in `email_verifications` table with 24-hour expiry
4. Sends branded verification email via Resend
5. Falls back to Supabase if Resend unavailable

**Debug Logging:**
Check browser console for these logs:
```
[v0] Starting registration process for: user@example.com
[v0] User created successfully: user-id-here
[v0] Sending verification email via Resend
[v0] Verification email sent successfully: email-id-here
```

#### What to Check:
- ✅ `emailRedirectTo` is properly set
- ✅ Email is trimmed and validated
- ✅ Resend API is called after user creation
- ✅ Error handling for both Supabase and Resend
- ✅ Fallback logic when Resend is unavailable

---

## 6. Common Issues and Solutions

### Issue 1: Emails Going to Spam

**Symptoms:**
- User doesn't receive confirmation email
- Email not in inbox

**Solutions:**
1. Check spam/junk folder
2. Add `noreply@mail.app.supabase.io` to contacts
3. Configure custom SMTP with verified domain
4. Set up SPF, DKIM, and DMARC records for your domain

---

### Issue 2: Rate Limiting

**Symptoms:**
- First few emails work, then stop
- Error: "Email rate limit exceeded"

**Solutions:**
1. Wait before sending more test emails
2. Upgrade Supabase plan for higher limits
3. Configure custom SMTP (no Supabase limits)
4. Use different email addresses for testing

---

### Issue 3: Invalid Email Address

**Symptoms:**
- Sign-up succeeds but no email sent
- No error message

**Solutions:**
1. Verify email format is valid
2. Test with a real, accessible email address
3. Check for typos in email address
4. Ensure email domain exists and accepts mail

---

### Issue 4: Email Confirmation Disabled

**Symptoms:**
- User is immediately logged in after sign-up
- No confirmation email sent
- User has session immediately

**Solutions:**
1. Enable "Confirm email" in Supabase Dashboard
2. Verify setting is saved
3. Test with new user registration

---

### Issue 5: Wrong Redirect URL

**Symptoms:**
- Email received but link doesn't work
- 404 error after clicking confirmation link
- Redirect to wrong domain

**Solutions:**
1. Verify `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` is correct
2. Add redirect URL to Supabase allowed list:
   - Dashboard → Authentication → URL Configuration
   - Add your callback URL to "Redirect URLs"
3. Ensure callback handler exists at `/auth/callback`

---

### Issue 6: Database Table Missing

**Symptoms:**
- Error: "relation email_verifications does not exist"
- Verification emails fail to send

**Solutions:**
1. Run the database migration script:
   ```bash
   # Run in Supabase SQL Editor or via migration tool
   scripts/007_create_email_verifications_table.sql
   ```
2. Verify table exists in Supabase dashboard
3. Check Row Level Security (RLS) policies are enabled
4. Restart application after migration

### Issue 7: Token Expired

**Symptoms:**
- Clicking verification link shows "token expired"
- Link worked previously

**Solutions:**
1. Verification tokens expire after 24 hours
2. Use "Resend Verification Email" button on sign-up success page
3. Check `email_verifications` table for token expiry time
4. Complete verification within 24 hours of registration

### Issue 8: Environment Variable Not Loaded

**Symptoms:**
- `RESEND_API_KEY` shows as undefined in logs
- Application uses Supabase fallback unexpectedly

**Solutions:**
1. **Development**: Check `.env.local` file exists and contains variables
2. **Production**: Verify environment variables in deployment platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Railway: Project → Variables
3. Restart application/redeploy after adding variables
4. Check variable names match exactly (case-sensitive)

---

## 7. Testing Email Delivery

### Manual Test Process

1. **Clear Browser Data**
   - Clear cookies and cache
   - Use incognito/private window

2. **Use Real Email**
   - Use an email address you can access
   - Avoid temporary/disposable email services

3. **Complete Registration**
   - Fill out all required fields
   - Submit the form
   - Note any error messages

4. **Check Multiple Locations**
   - Inbox
   - Spam/Junk folder
   - Promotions tab (Gmail)
   - Updates tab (Gmail)

5. **Wait Appropriately**
   - Emails may take 1-5 minutes
   - Check Supabase logs for delivery status

### Resend-Specific Testing

1. **Use Diagnostic Tool**
   - Navigate to `/admin/email-diagnostics`
   - Click "Run Diagnostics" to check configuration
   - Send test email to your address
   - Verify delivery in inbox and Resend dashboard

2. **Check Resend Dashboard**
   - Go to [resend.com/emails](https://resend.com/emails)
   - View recent email attempts
   - Check delivery status (queued, sent, delivered, bounced, failed)
   - Review error messages if any

3. **Test with Multiple Providers**
   - Gmail account
   - Outlook/Hotmail account  
   - Corporate email account
   - Custom domain email
   - Check spam folders for each

4. **Monitor Application Logs**
   ```
   [v0] Resend client initialized successfully
   [v0] Verification email sent successfully: re_abc123xyz
   ```

**If you see:**
- `[v0] Resend unavailable, using Supabase email service` → API key missing
- `[v0] Failed to send verification email` → Check Resend dashboard for error
- No `[v0]` logs → Check if console logs are enabled

---

## 8. Monitoring and Logs

### Supabase Auth Logs

**Location:** Supabase Dashboard → Logs → Auth Logs

#### What to Look For:
- `auth.signup` events
- Email delivery attempts
- Error messages
- Rate limit warnings

#### How to Access:
1. Go to your Supabase project
2. Click **Logs** in sidebar
3. Select **Auth** logs
4. Filter by timestamp of your test
5. Look for email-related events

### Application Logs

Check your application console for:
```
[v0] Starting registration process for: user@example.com
[v0] User created successfully: user-id-here
[v0] Profile verified successfully
```

### Resend API Logs

**Location:** [resend.com/emails](https://resend.com/emails)

#### What to Look For:
- Email send attempts with timestamps
- Delivery status indicators
- Bounce and complaint rates
- Error messages and failure reasons
- Webhook events (if configured)

#### Log Details:
- **Queued**: Email accepted by Resend
- **Sent**: Email handed to recipient's mail server
- **Delivered**: Email successfully delivered to inbox
- **Bounced**: Email rejected by recipient server
- **Failed**: Email could not be sent

### Application Debug Logs

Enable detailed logging by checking browser console during registration:

```javascript
// Look for these [v0] prefixed logs
[v0] Starting registration process for: user@example.com
[v0] User created successfully: user-id-here
[v0] Sending verification email via Resend
[v0] Verification email sent successfully: re_xyz123abc
[v0] Email ID: re_xyz123abc
```

**If you see:**
- `[v0] Resend unavailable, using Supabase email service` → API key missing
- `[v0] Failed to send verification email` → Check Resend dashboard for error
- No `[v0]` logs → Check if console logs are enabled

---

## 9. Production Checklist

Before deploying to production:

- [ ] Custom SMTP configured with verified domain
- [ ] SPF, DKIM, DMARC records set up
- [ ] Email templates customized with branding
- [ ] Redirect URLs added to Supabase allowed list
- [ ] Environment variables set in production
- [ ] Rate limits appropriate for expected traffic
- [ ] Email confirmation enabled
- [ ] Test email delivery from production environment
- [ ] Monitor email delivery rates
- [ ] Set up email delivery alerts

**Resend-Specific:**
- [ ] Resend API key added to production environment variables
- [ ] Custom domain verified in Resend dashboard
- [ ] SPF, DKIM, DMARC records configured
- [ ] Production `RESEND_FROM_EMAIL` uses verified domain
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Test email delivery from production environment
- [ ] Monitor Resend dashboard for delivery rates
- [ ] Set up Resend webhooks for delivery tracking (optional)
- [ ] Configure rate limit alerts in Resend
- [ ] Review and upgrade Resend plan if needed

---

## 10. Support Resources

### Supabase Documentation
- [Email Auth Guide](https://supabase.com/docs/guides/auth/auth-email)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

### Community Support
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)

### Contact Support
- Supabase Dashboard → Support
- Email: support@supabase.io

### Resend Resources
- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)
- [Resend Status Page](https://status.resend.com)
- [Resend Support](https://resend.com/support)

---

## Quick Reference Commands

```bash
# Run email diagnostic
npm run diagnose:email

# Check environment variables
env | grep SUPABASE

# Test Supabase connection
npm run test:connection

# View application logs
npm run dev # Check console output

# Access email diagnostics page
# Navigate to: /admin/email-diagnostics

# Check Resend configuration
curl http://localhost:3000/api/resend/test-connection

# Send test verification email
curl -X POST http://localhost:3000/api/resend/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Troubleshooting Decision Tree

```
Email not received?
├─ Check spam folder → Found? ✓ Add sender to contacts
├─ Run diagnostics at /admin/email-diagnostics
│  ├─ API Key invalid? → Generate new key in Resend dashboard
│  ├─ Domain not verified? → Use onboarding@resend.dev or verify domain
│  └─ Rate limit exceeded? → Wait or upgrade plan
├─ Check Resend dashboard logs
│  ├─ Email bounced? → Verify recipient email is valid
│  ├─ Email failed? → Check error message in dashboard
│  └─ Email delivered? → Check spam folder again
└─ Still not working? → Check browser console for [v0] logs
```

---

**Last Updated:** December 2024
**Application Version:** v223
