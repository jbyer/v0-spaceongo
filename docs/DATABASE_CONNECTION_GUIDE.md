# Database Connection Verification Guide

## Overview

This guide helps you verify that your application is correctly connected to the `spaceongo_v2` database on Supabase.

## Quick Verification

### Method 1: API Endpoint (Recommended)

Visit the following URL in your browser:
```
http://localhost:3000/api/database/verify
```

This will return a JSON response with:
- Environment variable status
- Database name verification
- Connection test results
- Sample data access test

### Method 2: Diagnostic Script

Run the comprehensive diagnostic script:
```bash
npm run script scripts/diagnose_database_connection.ts
```

This will perform 7 detailed tests:
1. ✅ Environment Variables Check
2. ✅ Database Name Verification
3. ✅ Supabase Client Creation
4. ✅ Database Connection Test
5. ✅ Table Accessibility Check
6. ✅ Authentication System Test
7. ✅ Row Level Security Test

## Expected Configuration

### Database Name
Your application should be connected to: **`spaceongo_v2`**

### Required Environment Variables

```env
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=...

# PostgreSQL Direct Connection
POSTGRES_DATABASE=spaceongo_v2
POSTGRES_HOST=aws-0-us-east-1.pooler.supabase.com
POSTGRES_USER=postgres.xxxxx
POSTGRES_PASSWORD=...
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
```

## Troubleshooting

### Issue: "Could not retrieve live database schema"

**Possible Causes:**
1. Database tables haven't been created yet
2. RLS policies are blocking access
3. Connection credentials are incorrect
4. Network/firewall issues

**Solutions:**
1. Run the database setup scripts:
   ```bash
   npm run script scripts/001_create_database_schema.sql
   npm run script scripts/002_enable_row_level_security.sql
   npm run script scripts/003_create_profile_trigger.sql
   ```

2. Verify your Supabase project is active in the Supabase dashboard

3. Check that your IP is not blocked by Supabase's network policies

### Issue: Database name mismatch

If the diagnostic shows a different database name:

1. Check your environment variables in the Vercel dashboard or `.env.local`
2. Verify the `POSTGRES_DATABASE` variable is set to `spaceongo_v2`
3. Restart your development server after changing environment variables

### Issue: Tables not accessible

If tables are not accessible:

1. Ensure all migration scripts have been run successfully
2. Check RLS policies in Supabase dashboard
3. Verify the service role key has proper permissions

## Connection Architecture

```
Application
    ↓
Environment Variables
    ↓
Supabase Client (lib/supabase/client.ts)
    ↓
Supabase API (https://[project].supabase.co)
    ↓
PostgreSQL Database (spaceongo_v2)
    ↓
Tables with RLS Policies
```

## Verification Checklist

- [ ] All environment variables are set
- [ ] Database name is `spaceongo_v2`
- [ ] Supabase client can be created
- [ ] Database connection is established
- [ ] All 12+ tables are accessible
- [ ] Authentication system is working
- [ ] RLS policies are active
- [ ] Sample queries return data

## Next Steps

Once verification is complete:

1. **If all tests pass:** Your database is ready for development
2. **If tests fail:** Review the detailed error messages and follow troubleshooting steps
3. **For production:** Ensure all environment variables are set in your Vercel project settings

## Support

If you continue to experience issues:

1. Check the Supabase dashboard for project status
2. Review Supabase logs for error messages
3. Verify your Supabase project hasn't been paused
4. Check your Supabase project's database settings
