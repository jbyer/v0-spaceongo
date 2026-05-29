-- Verification script to check if auth schema is accessible
-- Run this BEFORE running 001_create_database_schema.sql

-- Check if auth schema exists and is accessible
DO $$ 
BEGIN
  -- Try to query auth.users
  PERFORM 1 FROM auth.users LIMIT 1;
  RAISE NOTICE 'SUCCESS: auth.users table is accessible';
EXCEPTION
  WHEN undefined_table THEN
    RAISE EXCEPTION 'ERROR: auth.users table does not exist. Make sure Supabase authentication is enabled.';
  WHEN insufficient_privilege THEN
    RAISE EXCEPTION 'ERROR: Insufficient privileges to access auth.users. Make sure you are using the service role key.';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'ERROR: Cannot access auth schema: %', SQLERRM;
END $$;

-- Verify required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✓ All prerequisites verified. You can now run 001_create_database_schema.sql';
END $$;
