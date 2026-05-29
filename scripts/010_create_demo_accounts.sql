-- Create Demo Test Accounts for SpaceOnGo
-- These accounts are for testing purposes only and should NOT be used in production

-- Demo Account #1: Regular Renter (Non-Host)
-- Email: renter.demo@spaceongo.com
-- Password: DemoRenter2025!
-- Role: Renter (is_host = false)

INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  phone,
  is_host,
  is_superuser,
  bio,
  profile_image_url,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'renter.demo@spaceongo.com',
  'Demo',
  'Renter',
  'Demo Renter',
  '+1-555-0100',
  false, -- NOT a host, only a renter
  false,
  'Test account for renter functionality. This account is configured to book spaces but cannot list spaces.',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoRenter',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  is_host = EXCLUDED.is_host,
  is_superuser = EXCLUDED.is_superuser,
  bio = EXCLUDED.bio,
  profile_image_url = EXCLUDED.profile_image_url,
  updated_at = NOW();

-- Demo Account #2: Host/Renter (Can do both)
-- Email: host.demo@spaceongo.com
-- Password: DemoHost2025!
-- Role: Host (is_host = true)

INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  display_name,
  phone,
  is_host,
  is_superuser,
  bio,
  profile_image_url,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'host.demo@spaceongo.com',
  'Demo',
  'Host',
  'Demo Host',
  '+1-555-0101',
  true, -- IS a host, can list spaces
  false,
  'Test account for host functionality. This account can list spaces and also book spaces from other hosts.',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoHost',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  is_host = EXCLUDED.is_host,
  is_superuser = EXCLUDED.is_superuser,
  bio = EXCLUDED.bio,
  profile_image_url = EXCLUDED.profile_image_url,
  updated_at = NOW();

-- IMPORTANT SETUP INSTRUCTIONS:
-- 
-- After running this SQL script, you MUST manually create the corresponding auth users in Supabase:
-- 
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create:
--    
--    Renter Demo Account:
--    - Email: renter.demo@spaceongo.com
--    - Password: DemoRenter2025!
--    - User UUID: 00000000-0000-0000-0000-000000000001
--    - Auto Confirm User: Yes
--    
--    Host Demo Account:
--    - Email: host.demo@spaceongo.com  
--    - Password: DemoHost2025!
--    - User UUID: 00000000-0000-0000-0000-000000000002
--    - Auto Confirm User: Yes
--
-- 3. The UUID MUST match the profile ID for the accounts to link correctly
--
-- Note: These accounts are for TESTING ONLY and should be removed in production environments.
