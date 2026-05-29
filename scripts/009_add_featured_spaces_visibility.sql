-- Add featured spaces visibility setting to admin_settings table
-- This allows admins to show/hide the Featured Spaces section on the homepage

-- Only insert if the setting doesn't already exist (preserve existing value)
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
('featured_spaces_visible', 'true', 'Show or hide the Featured Spaces section on homepage')
ON CONFLICT (setting_key) DO NOTHING;
