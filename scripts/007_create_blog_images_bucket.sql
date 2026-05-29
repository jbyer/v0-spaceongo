-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for blog images
CREATE POLICY "Public Access for Blog Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own blog images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins and superusers can delete blog images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_admin = true OR profiles.is_superuser = true)
  )
);
