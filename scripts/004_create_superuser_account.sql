-- Create superuser account in Supabase
-- This script creates admin users with proper conflict handling

-- Updated to use proper auth.users integration
-- Note: This script assumes auth.users already exist or will be created through Supabase Auth
-- The profiles will be created/updated when users sign up through the auth system

-- Option 1: If you want to create profiles that will be linked later to auth users
-- Use this approach for pre-creating admin profiles

-- Insert or update superuser profile
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  is_admin,
  is_superuser,
  is_host,
  created_at,
  updated_at
) 
SELECT 
  id,
  email,
  'Jason',
  'Administrator',
  'Jason Administrator',
  true,
  true,
  true,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'jason@example.com'
ON CONFLICT (id) DO UPDATE SET
  is_admin = EXCLUDED.is_admin,
  is_superuser = EXCLUDED.is_superuser,
  is_host = EXCLUDED.is_host,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

-- Insert or update demo user profile
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  is_admin,
  is_superuser,
  is_host,
  created_at,
  updated_at
) 
SELECT 
  id,
  email,
  'Demo',
  'User',
  'Demo User',
  false,
  false,
  false,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'demo@spaceongo.com'
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

-- Verify the users were created/updated
SELECT 
  p.id,
  p.email,
  p.display_name,
  p.is_admin,
  p.is_superuser,
  p.is_host,
  p.created_at,
  au.created_at as auth_created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email IN ('jason@example.com', 'demo@spaceongo.com')
ORDER BY p.is_superuser DESC;

-- Display instructions if users don't exist in auth.users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jason@example.com') THEN
    RAISE NOTICE 'IMPORTANT: Create auth user for jason@example.com in Supabase Dashboard';
    RAISE NOTICE '1. Go to Authentication > Users in Supabase Dashboard';
    RAISE NOTICE '2. Click "Add User" and create user with email: jason@example.com';
    RAISE NOTICE '3. After creation, run this script again to link the profile';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@spaceongo.com') THEN
    RAISE NOTICE 'IMPORTANT: Create auth user for demo@spaceongo.com in Supabase Dashboard';
    RAISE NOTICE '1. Go to Authentication > Users in Supabase Dashboard';
    RAISE NOTICE '2. Click "Add User" and create user with email: demo@spaceongo.com';
    RAISE NOTICE '3. After creation, run this script again to link the profile';
  END IF;
END $$;
