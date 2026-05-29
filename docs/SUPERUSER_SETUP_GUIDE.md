# Superuser Account Setup Guide

## Overview
This guide explains how to create superuser and admin accounts in your SpaceOnGo application using Supabase authentication.

## Prerequisites
- Supabase project configured and connected
- Database schema created (run `001_create_database_schema.sql`)
- Row Level Security enabled (run `002_enable_row_level_security.sql`)
- Profile trigger created (run `003_create_profile_trigger.sql`)

## Setup Process

### Step 1: Add Email Unique Constraint
First, ensure the email column has a unique constraint:

```bash
# Run this migration first
scripts/006_add_email_unique_constraint.sql
```

This adds the necessary unique constraint to support ON CONFLICT operations.

### Step 2: Create Auth Users in Supabase

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"**
4. Create the superuser account:
   - Email: `jason@example.com`
   - Password: (set a secure password)
   - Auto Confirm User: ✓ (checked)
5. Repeat for demo user:
   - Email: `demo@spaceongo.com`
   - Password: (set a secure password)
   - Auto Confirm User: ✓ (checked)

#### Option B: Using Supabase API
```typescript
// In a server action or API route
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key
)

// Create superuser
const { data, error } = await supabase.auth.admin.createUser({
  email: 'jason@example.com',
  password: 'secure_password_here',
  email_confirm: true,
  user_metadata: {
    first_name: 'Jason',
    last_name: 'Administrator'
  }
})
```

### Step 3: Link Profiles to Auth Users
After creating the auth users, run the superuser script:

```bash
# This will create/update profiles with admin privileges
scripts/004_create_superuser_account.sql
```

This script will:
- Link existing auth.users to profiles table
- Set admin and superuser flags
- Create proper user metadata

### Step 4: Verify Setup
Run this query to verify the setup:

```sql
SELECT 
  p.id,
  p.email,
  p.display_name,
  p.is_admin,
  p.is_superuser,
  p.is_host,
  au.email as auth_email,
  au.confirmed_at
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id
WHERE p.email IN ('jason@example.com', 'demo@spaceongo.com')
ORDER BY p.is_superuser DESC;
```

Expected output:
```
id                                   | email                  | is_admin | is_superuser | confirmed_at
-------------------------------------|------------------------|----------|--------------|-------------
uuid-here                            | jason@example.com      | true     | true         | timestamp
uuid-here                            | demo@spaceongo.com     | false    | false        | timestamp
```

## Understanding the Profile Trigger

The `003_create_profile_trigger.sql` script creates an automatic trigger that:
- Creates a profile entry whenever a new user signs up through Supabase Auth
- Copies email and metadata from auth.users to profiles
- Sets default values for new users (is_admin=false, is_superuser=false)

For admin users, you need to manually update these flags using the superuser script.

## Troubleshooting

### Error: "there is no unique or exclusion constraint"
**Solution**: Run `006_add_email_unique_constraint.sql` first to add the unique constraint.

### Error: "violates foreign key constraint"
**Cause**: Trying to create a profile without a corresponding auth.users entry.
**Solution**: Create the auth user first (Step 2), then run the profile script (Step 3).

### Profile not created automatically
**Check**:
1. Verify the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
2. Check if the function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`
3. Re-run `003_create_profile_trigger.sql` if needed

### Admin flags not set
**Solution**: Run the superuser script again after the auth user exists:
```bash
scripts/004_create_superuser_account.sql
```

## Security Notes

1. **Service Role Key**: Only use the service role key server-side, never expose it to clients
2. **Password Security**: Use strong passwords for admin accounts
3. **Email Confirmation**: Always confirm admin emails to prevent unauthorized access
4. **Row Level Security**: Ensure RLS policies are enabled to protect user data

## Production Deployment

For production:
1. Change default email addresses to real admin emails
2. Use environment variables for sensitive data
3. Enable 2FA for admin accounts in Supabase dashboard
4. Regularly audit admin access logs
5. Consider using SSO for admin authentication

## Next Steps

After setting up superuser accounts:
1. Test login with admin credentials
2. Verify admin dashboard access
3. Test user management features
4. Configure additional admin settings in `admin_settings` table
