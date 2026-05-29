-- Create storage bucket for space listing images
-- This bucket will store all images uploaded by hosts for their space listings

-- Insert the bucket (Supabase will create it if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'space-images',
  'space-images',
  true,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Removed ALTER TABLE statement - RLS is already enabled by default on storage.objects in Supabase
-- Note: Row Level Security is enabled by default on storage.objects in Supabase
-- No need to explicitly enable it, which would require superuser privileges

-- Policy: Anyone can view space images (public bucket)
CREATE POLICY "Anyone can view space images"
ON storage.objects FOR SELECT
USING (bucket_id = 'space-images');

-- Policy: Authenticated users can upload space images
CREATE POLICY "Authenticated users can upload space images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'space-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own space images
CREATE POLICY "Users can update their own space images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'space-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own space images
CREATE POLICY "Users can delete their own space images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'space-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
