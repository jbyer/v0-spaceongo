# Supabase Connection Status - spaceongo_v2

## Quick Connection Check

Visit `/api/connection-status` in your browser to see real-time connection status.

## Running Comprehensive Tests

Execute the connection test script:

```bash
# This will run 8 comprehensive tests
npm run test:connection
```

Or run directly:

```bash
node --loader ts-node/esm scripts/test_spaceongo_v2_connection.ts
```

## What Gets Tested

### 1. Environment Variables (13 variables)
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `POSTGRES_DATABASE`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`

### 2. Database Name Verification
Confirms connection to `spaceongo_v2` database specifically.

### 3. Supabase URL Format
Validates the URL format and domain.

### 4. Client Creation
Tests if Supabase client can be instantiated.

### 5. Database Connection
Performs actual query to verify connectivity.

### 6. Table Accessibility (12 tables)
Checks access to all application tables:
- profiles
- spaces
- space_categories
- bookings
- reviews
- favorites
- messages
- notifications
- blog_posts
- payments
- subscriptions
- admin_settings

### 7. Authentication System
Verifies auth system is operational.

### 8. Row Level Security
Confirms RLS policies are active and working.

## Expected Results

### ✓ All Tests Pass
Your application is fully connected to spaceongo_v2 and ready for use.

### ⚠ Warnings Present
Connection is established but some features may need attention. Review warnings.

### ✗ Tests Failed
Connection issues detected. Common causes:
- Incorrect environment variables
- Wrong database selected
- Network/firewall issues
- Missing database tables
- RLS policies blocking access

## Troubleshooting

### Connection Fails
1. Verify environment variables in Vercel dashboard
2. Check Supabase project is active
3. Confirm database name matches `spaceongo_v2`
4. Review Supabase project settings

### Tables Not Accessible
1. Run database migration scripts in order
2. Check RLS policies are properly configured
3. Verify service role key has admin access

### Authentication Issues
1. Confirm JWT secret is correct
2. Check auth settings in Supabase dashboard
3. Verify email confirmation settings

## Manual Verification

You can also manually verify the connection using the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to Table Editor
3. Confirm you see all 12 tables
4. Check the database name in Settings > Database
5. Verify it shows `spaceongo_v2`

## API Endpoint Response

The `/api/connection-status` endpoint returns:

```json
{
  "status": "connected",
  "database": "spaceongo_v2",
  "timestamp": "2025-01-13T10:30:00.000Z",
  "checks": {
    "databaseConnection": true,
    "authSystem": true,
    "tablesAccessible": true,
    "tableStatus": {
      "spaces": true,
      "bookings": true,
      "reviews": true,
      "space_categories": true
    }
  },
  "environment": {
    "supabaseUrl": "https://xxxxx.supabase.co...",
    "databaseName": "spaceongo_v2",
    "hasAnonKey": true,
    "hasServiceKey": true
  }
}
```

## Next Steps

Once all tests pass:
1. Run database migration scripts if not already done
2. Test authentication flow
3. Verify RLS policies
4. Begin application development

## Support

If connection issues persist:
1. Check Vercel deployment logs
2. Review Supabase project logs
3. Verify all environment variables are set correctly
4. Ensure database migrations have been run
