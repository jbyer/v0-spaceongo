# Demo Test Accounts Setup Guide

This guide explains how to set up and use the demo test accounts for SpaceOnGo development and testing.

## Overview

SpaceOnGo includes three pre-configured demo accounts for testing different user roles:

1. **Renter Demo Account** - Regular user who can only book spaces (not a host)
2. **Host Demo Account** - User who can list spaces and also book from others (uses existing demo account)
3. **Superuser Admin** - Full admin access to all system features

## Setup Instructions

### Step 1: Run the SQL Script

First, execute the database script to create the profile records:

```bash
# In Supabase SQL Editor or your database tool, run:
scripts/010_create_demo_accounts.sql
```

This creates the profile records in the `profiles` table with the correct UUIDs and role configurations.

### Step 2: Create Auth Users in Supabase

Since Supabase separates authentication from user profiles, you must manually create the auth users:

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Click "Add user"** (manually create user)

#### Renter Demo Account

- **Email:** `renter.demo@spaceongo.com`
- **Password:** `DemoRenter2025!`
- **User UUID:** `00000000-0000-0000-0000-000000000001`
- **Auto Confirm User:** ✅ Yes
- **Send Magic Link:** ❌ No

#### Host Demo Account (Uses Existing Account)

The host demo account uses the existing `demo@spaceongo.com` account that is already set up in the database. No additional setup required.

- **Email:** `demo@spaceongo.com`
- **Password:** `password123`
- **Note:** This is an existing account that is already configured with host privileges

> **Important:** The UUID must match exactly with the profile IDs created in the SQL script for the accounts to link correctly.

### Step 3: Verify Setup

After creating the auth users, verify the setup:

1. Go to the login page
2. Use one of the demo account credentials
3. Verify you can log in successfully
4. Check that the user role (host/renter) is correctly applied

## Account Details

### 1. Renter Demo Account

**Credentials:**
- Email: `renter.demo@spaceongo.com`
- Password: `DemoRenter2025!`

**Role Configuration:**
- `is_host`: `false`
- `is_superuser`: `false`

**Capabilities:**
- ✅ Browse and search spaces
- ✅ Book available spaces
- ✅ View and manage their bookings
- ✅ Leave reviews for spaces they've booked
- ✅ Update their profile
- ❌ Cannot list or manage spaces (not a host)
- ❌ No admin access

**Use Case:**
Test the renter experience - booking flow, payment, reviews, and booking management without host privileges.

---

### 2. Host Demo Account

**Credentials:**
- Email: `demo@spaceongo.com`
- Password: `password123`

**Role Configuration:**
- `is_host`: `true`
- `is_superuser`: `false`

**Capabilities:**
- ✅ All renter capabilities (can book spaces)
- ✅ List and manage their own spaces
- ✅ View bookings for their spaces
- ✅ Manage space availability and pricing
- ✅ Respond to booking requests
- ❌ No admin access

**Use Case:**
Test the host experience - listing spaces, managing bookings, viewing earnings, and also test booking spaces from other hosts.

**Note:** This uses the existing `demo@spaceongo.com` account that is already set up in the database with host privileges.

---

### 3. Superuser Admin

**Credentials:**
- Email: `jason@example.com`
- Password: `testing123`

**Role Configuration:**
- `is_host`: `true`
- `is_superuser`: `true`

**Capabilities:**
- ✅ Full access to all features
- ✅ Access to admin dashboard
- ✅ Manage all users and spaces
- ✅ View system analytics
- ✅ Configure system settings

**Use Case:**
Test admin features and system management capabilities.

---

## Using Demo Accounts

### Quick Login

On the login page, you'll find a "Demo Test Accounts" section with three cards showing each account's credentials. Each card has a "Fill Credentials" button that auto-fills the login form.

### Testing Workflows

#### Renter Workflow
1. Log in with renter demo account
2. Browse spaces in "Find Space"
3. Book a space (use Stripe test cards)
4. View booking in "My Bookings"
5. After booking ends, leave a review

#### Host Workflow
1. Log in with host demo account (`demo@spaceongo.com`)
2. Go to "List Your Space"
3. Create a new space listing
4. Manage your spaces in "My Spaces"
5. View bookings made for your spaces

#### Admin Workflow
1. Log in with superuser account
2. Access admin dashboard at `/admin`
3. View system analytics and user management

## Security Notes

### Development vs Production

⚠️ **These accounts are for TESTING ONLY**

- Use predictable UUIDs for easy testing
- Passwords are documented (not secure for production)
- Should be removed before deploying to production

### Production Deployment

Before deploying to production:

1. Delete these demo accounts from Supabase Auth
2. Remove the profile records from the database
3. Update RLS policies if they reference these UUIDs
4. Remove the demo credentials section from the login form

## Troubleshooting

### Can't log in with demo account

**Issue:** "Invalid login credentials" error

**Solutions:**
1. Verify you ran the SQL script first (for renter account)
2. Check that you created the auth user in Supabase Dashboard (for renter account)
3. For host demo, verify `demo@spaceongo.com` exists and password is `password123`
4. Ensure the UUID matches exactly: `00000000-0000-0000-0000-000000000001` (renter)
5. Verify "Auto Confirm User" was enabled when creating the auth user

### Profile not found after login

**Issue:** User can log in but gets profile errors

**Solutions:**
1. Check that the profile record exists: `SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001'`
2. Verify the auth user UUID matches the profile ID exactly
3. Check RLS policies aren't blocking profile access

### Wrong role assigned

**Issue:** Renter can list spaces or host can't access host features

**Solutions:**
1. Check `is_host` value in profiles table
2. Re-run the SQL script to update the profile
3. Clear browser cache and log in again

## Additional Resources

- [Authentication Documentation](./AUTHENTICATION.md)
- [User Roles Documentation](./USER_ROLES.md)
- [Database Schema](./DATABASE_SCHEMA_PLAN.md)
