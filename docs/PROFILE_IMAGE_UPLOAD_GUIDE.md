# Profile Image Upload Implementation Guide

## Overview
This guide documents the profile image upload functionality integrated with Supabase Storage for the SpaceOnGo platform.

## Architecture

### Storage Bucket
- **Bucket Name**: `profile-images`
- **Public Access**: Yes (read-only)
- **Location**: Supabase Storage

### Database Integration
- **Table**: `profiles`
- **Column**: `profile_image_url` (TEXT)
- **Stores**: Public URL of the uploaded image

## Security Implementation

### Row Level Security (RLS) Policies

1. **Public Read Access**
   - Anyone can view profile images
   - Required for displaying user avatars across the platform

2. **Authenticated Upload**
   - Only authenticated users can upload images
   - Images must be uploaded to a folder matching the user's ID
   - Prevents unauthorized uploads

3. **User-Specific Updates**
   - Users can only update their own profile images
   - Folder structure enforces ownership: `{user_id}/{filename}`

4. **User-Specific Deletion**
   - Users can only delete their own profile images
   - Prevents unauthorized deletion of other users' images

### File Validation

#### Client-Side Validation
- **File Type**: Must be an image (checked via MIME type)
- **File Size**: Maximum 5MB
- **Format Support**: JPG, PNG, GIF, WebP

#### Server-Side Security
- Supabase Storage validates file types
- RLS policies enforce user ownership
- Content-Type header is set during upload

## Upload Flow

### 1. User Selection
```typescript
<Input
  type="file"
  accept="image/*"
  onChange={handleProfilePictureUpload}
/>
```

### 2. Validation
- Check file type (must start with "image/")
- Check file size (max 5MB)
- Display error if validation fails

### 3. Preview Generation
- Create FileReader to generate preview
- Display preview immediately for better UX
- Preview shown before upload completes

### 4. Upload to Storage
```typescript
const filePath = `${user.id}/${fileName}`
await supabase.storage
  .from("profile-images")
  .upload(filePath, file, { 
    upsert: true,
    contentType: file.type
  })
```

### 5. Database Update
```typescript
await supabase
  .from("profiles")
  .update({ profile_image_url: publicUrl })
  .eq("id", user.id)
```

### 6. UI Feedback
- Success message displayed
- Profile picture updated in UI
- Auto-dismiss after 3 seconds

## File Naming Convention

### Pattern
```
{user_id}/{user_id}-{timestamp}.{extension}
```

### Example
```
550e8400-e29b-41d4-a716-446655440000/550e8400-e29b-41d4-a716-446655440000-1704067200000.jpg
```

### Benefits
- Unique filenames prevent collisions
- User ID in path enables RLS enforcement
- Timestamp allows version tracking
- Easy to identify file ownership

## Error Handling

### Upload Errors
- Network failures
- Storage quota exceeded
- Invalid file format
- File too large

### Database Errors
- Profile update failures
- Authentication errors
- Permission denied

### User Feedback
All errors display user-friendly messages:
- "Please select a valid image file"
- "Image size must be less than 5MB"
- "Failed to upload image. Please try again."
- "Failed to update profile picture"

## Image Removal

### Process
1. User clicks remove button
2. Profile image URL set to null in database
3. UI reverts to default placeholder
4. Original file remains in storage (for recovery)

### Future Enhancement
Consider implementing automatic cleanup of orphaned images.

## Performance Optimization

### Current Implementation
- Immediate preview using FileReader
- Async upload doesn't block UI
- Loading states during upload
- Optimistic UI updates

### Recommendations
1. **Image Compression**: Compress images before upload
2. **Thumbnail Generation**: Create thumbnails for faster loading
3. **CDN Integration**: Leverage Supabase CDN for faster delivery
4. **Lazy Loading**: Load images only when visible

## Testing Checklist

### Functional Testing
- [ ] Upload JPG image
- [ ] Upload PNG image
- [ ] Upload GIF image
- [ ] Upload WebP image
- [ ] Reject non-image files
- [ ] Reject files over 5MB
- [ ] Preview displays correctly
- [ ] Database updates successfully
- [ ] Remove profile picture works
- [ ] Error messages display correctly

### Security Testing
- [ ] Unauthenticated users cannot upload
- [ ] Users cannot upload to other users' folders
- [ ] Users cannot delete other users' images
- [ ] File type validation works
- [ ] File size validation works
- [ ] RLS policies enforce correctly

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Troubleshooting

### Common Issues

#### "Failed to upload image"
- Check Supabase connection
- Verify storage bucket exists
- Check RLS policies are active
- Verify user authentication

#### "Failed to update profile picture"
- Check database connection
- Verify profiles table exists
- Check RLS policies on profiles table
- Verify user has permission

#### Images not displaying
- Check public URL is correct
- Verify bucket is public
- Check CORS settings
- Verify image file exists

## Future Enhancements

1. **Image Cropping**: Allow users to crop images before upload
2. **Multiple Images**: Support multiple profile images
3. **Image Filters**: Apply filters/effects to images
4. **Automatic Compression**: Compress large images automatically
5. **Progress Indicator**: Show upload progress percentage
6. **Drag and Drop**: Support drag-and-drop upload
7. **Webcam Capture**: Allow taking photos with webcam
8. **Image History**: Keep history of previous profile pictures

## Related Documentation
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Database Schema Plan](./DATABASE_SCHEMA_PLAN.md)
- [RLS Policies Guide](./RLS_POLICIES_GUIDE.md)
