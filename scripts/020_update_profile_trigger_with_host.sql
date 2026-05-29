-- Update profile trigger to include is_host from user metadata
-- This ensures users registering as hosts get is_host=true from the start

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value TEXT;
  is_host_value BOOLEAN;
BEGIN
  -- Get user_role from metadata
  user_role_value := NEW.raw_user_meta_data ->> 'user_role';
  
  -- Determine is_host based on user_role
  is_host_value := CASE WHEN user_role_value = 'host' THEN TRUE ELSE FALSE END;

  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    display_name,
    is_host,
    user_role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
    is_host_value,
    user_role_value
  )
  ON CONFLICT (id) DO UPDATE SET
    is_host = COALESCE(EXCLUDED.is_host, profiles.is_host),
    user_role = COALESCE(EXCLUDED.user_role, profiles.user_role);

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
