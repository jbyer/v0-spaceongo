# Database Setup Troubleshooting Guide

## Common Errors and Solutions

### Error: "relation auth.users does not exist"

**Cause:** The script is trying to reference Supabase's authentication table, but it's not accessible.

**Solutions:**
1. **Verify you're using the correct database connection:**
   - Make sure `POSTGRES_DATABASE` is set to `spaceongo_v2`
   - Verify `SUPABASE_URL` points to your correct project

2. **Check authentication is enabled:**
   - Go to Supabase Dashboard → Authentication
   - Ensure authentication is enabled for your project

3. **Use Service Role Key:**
   - The script needs elevated permissions
   - Make sure you're using `SUPABASE_SERVICE_ROLE_KEY`, not the anon key
   - In v0, this is automatically configured

4. **Run verification script first:**
   ```bash
   # Run this before the main schema script
   scripts/000_verify_auth_schema.sql
   ```

### Error: "trigger already exists"

**Cause:** The script is trying to create triggers that already exist from a previous run.

**Solution:** The updated script now includes `DROP TRIGGER IF EXISTS` statements to handle this automatically.

### Error: "function already exists"

**Cause:** The `update_updated_at_column()` function already exists.

**Solution:** The updated script now includes `DROP FUNCTION IF EXISTS` to handle this automatically.

### Error: "duplicate key value violates unique constraint"

**Cause:** Trying to insert default data (categories, settings) that already exists.

**Solution:** The script uses `ON CONFLICT DO NOTHING` to safely skip existing records.

## Recommended Setup Order

Run scripts in this order:

1. **000_verify_auth_schema.sql** - Verify prerequisites
2. **001_create_database_schema.sql** - Create all tables
3. **002_enable_row_level_security.sql** - Enable RLS policies
4. **003_create_profile_trigger.sql** - Auto-create profiles
5. **004_create_rating_update_function.sql** - Rating aggregation
6. **005_create_payments_table.sql** - Payment tracking
7. **006_add_email_unique_constraint.sql** - Email uniqueness

## Verification Steps

After running the scripts, verify the setup:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check if triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## Manual Fix for auth.users Reference

If the automatic fix doesn't work, you can manually add the foreign key constraint after verifying auth access:

```sql
-- First verify auth.users is accessible
SELECT COUNT(*) FROM auth.users;

-- Then add the constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Getting Help

If you continue to experience issues:

1. Check the Supabase Dashboard logs
2. Verify all environment variables are correct
3. Run the connection diagnostic: `scripts/diagnose_database_connection.ts`
4. Check the API health endpoint: `/api/database/verify`
