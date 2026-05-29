# Blog Image Upload Feature Guide

## Overview

The blog management system now includes comprehensive image upload functionality for both featured images and in-content images. All images are stored securely in Supabase Storage with proper validation and access controls.

## Features

### 1. Featured Image Upload
- **Drag & Drop Support**: Drag images directly onto the upload area
- **File Browser**: Click to browse and select images from your computer
- **Live Preview**: See uploaded images immediately with edit/remove options
- **Validation**: Automatic file type and size validation
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Size Limit**: 5MB per image

### 2. In-Content Image Upload
- **Quill Editor Integration**: Click the image button in the toolbar
- **Automatic Upload**: Images are uploaded to Supabase Storage
- **Direct Insertion**: Images are automatically inserted at cursor position
- **Same Validation**: Same security and validation as featured images

## Setup Instructions

### Step 1: Create Storage Bucket

Run the SQL script to create the blog images storage bucket:

```bash
# Run this script in your Supabase SQL editor or via the v0 script runner
scripts/007_create_blog_images_bucket.sql
```

This creates:
- `blog-images` storage bucket (public access for reading)
- Storage policies for authenticated users to upload
- Admin/superuser policies for deletion

### Step 2: Verify Permissions

Ensure your user account has admin or superuser privileges:
- Only admins and superusers can upload blog images
- Check your profile in the database: `is_admin` or `is_superuser` should be `true`

### Step 3: Test Upload

1. Navigate to Admin Dashboard → Blog Management
2. Click "New Blog Post"
3. Scroll to "Featured Image" section
4. Drag an image or click to browse
5. Wait for upload confirmation
6. Image URL is automatically saved to the post

## Technical Details

### Storage Structure

```
blog-images/
├── featured/
│   └── [timestamp]-[random].jpg    # Featured images
└── content/
    └── [timestamp]-[random].png    # In-content images
```

### API Endpoints

**Upload Image**
```
POST /api/blog/upload-image
Content-Type: multipart/form-data

Body:
- file: File (required)
- folder: "featured" | "content" (optional, default: "featured")

Response:
{
  "url": "https://[project].supabase.co/storage/v1/object/public/blog-images/...",
  "path": "featured/1234567890-abc123.jpg"
}
```

### Security Features

1. **Authentication Required**: Only logged-in users can upload
2. **Role-Based Access**: Only admins/superusers can upload blog images
3. **File Type Validation**: Only image files accepted
4. **Size Limits**: 5MB maximum per image
5. **Secure Storage**: Images stored in Supabase with RLS policies

### Validation Rules

**Client-Side:**
- File type must be image/*
- Specific types: JPEG, PNG, GIF, WebP
- Maximum size: 5MB
- Visual feedback for errors

**Server-Side:**
- Authentication check
- Admin/superuser role verification
- File type validation
- Size limit enforcement

## Usage Examples

### Featured Image Upload

```typescript
// In your blog editor component
const handleFeaturedImageUpload = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("folder", "featured")

  const response = await fetch("/api/blog/upload-image", {
    method: "POST",
    body: formData,
  })

  const { url } = await response.json()
  return url
}
```

### In-Content Image Upload (Quill)

```typescript
// Custom Quill image handler
const handleQuillImageUpload = () => {
  const input = document.createElement("input")
  input.setAttribute("type", "file")
  input.setAttribute("accept", "image/*")
  input.click()

  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "content")

    const response = await fetch("/api/blog/upload-image", {
      method: "POST",
      body: formData,
    })

    const { url } = await response.json()
    
    // Insert into editor
    const range = quillRef.current.getSelection()
    quillRef.current.insertEmbed(range.index, "image", url)
  }
}
```

## Troubleshooting

### Upload Fails with 401 Unauthorized
- Ensure you're logged in
- Check your session hasn't expired
- Try logging out and back in

### Upload Fails with 403 Forbidden
- Verify your account has admin or superuser privileges
- Check the `profiles` table: `is_admin` or `is_superuser` should be `true`

### Upload Fails with 400 Bad Request
- Check file is a valid image format
- Ensure file size is under 5MB
- Verify file isn't corrupted

### Images Don't Display
- Check Supabase storage bucket is public
- Verify storage policies are correctly set
- Check browser console for CORS errors

### Storage Bucket Doesn't Exist
- Run the `007_create_blog_images_bucket.sql` script
- Verify in Supabase dashboard under Storage

## Best Practices

1. **Optimize Images Before Upload**
   - Compress images to reduce file size
   - Use appropriate dimensions (1200x630 for featured images)
   - Convert to WebP for better compression

2. **Alt Text**
   - Always add descriptive alt text for accessibility
   - Include keywords for SEO

3. **Image Organization**
   - Featured images go in `featured/` folder
   - Content images go in `content/` folder
   - Automatic timestamping prevents naming conflicts

4. **Performance**
   - Use lazy loading for blog post images
   - Consider CDN for high-traffic blogs
   - Implement image optimization pipeline

## Future Enhancements

- [ ] Image cropping and editing
- [ ] Automatic image optimization
- [ ] Multiple image upload for galleries
- [ ] Image library/media manager
- [ ] CDN integration
- [ ] Automatic alt text generation
- [ ] Image compression before upload
