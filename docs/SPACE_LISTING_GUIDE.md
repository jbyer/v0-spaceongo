# Space Listing Creation Guide

## Overview

This guide explains how the space listing creation feature works in the SpaceOnGo platform, including the technical implementation, security measures, and user flow.

## User Flow

### 1. Authentication Check
- Users must be logged in to create a space listing
- The system verifies authentication before allowing form submission
- Unauthenticated users are redirected to the login page

### 2. Multi-Step Form (4 Steps)

#### Step 1: Basic Information
- **Space Type**: Select from 8 predefined categories (Office, Studio, Event, Kitchen, Retail, Residential, Entertainment, Fitness)
- **Title**: Minimum 10 characters, descriptive name for the space
- **Description**: Minimum 50 characters, detailed description of features and amenities
- **Capacity**: Maximum number of people the space can accommodate

#### Step 2: Location Details
- **Street Address**: Full street address (kept private until booking confirmed)
- **City**: City name
- **State**: US state selection from dropdown
- **ZIP Code**: 5-digit or 9-digit ZIP code with validation

#### Step 3: Pricing & Availability
- **Hourly Rate**: Price per hour (minimum $1)
- **Daily Rate**: Price per day (typically 4-8x hourly rate)
- **Availability**: Choose from predefined schedules or custom
- **House Rules**: Optional guidelines for guests

#### Step 4: Media & Amenities
- **Images**: Upload 1-10 high-quality photos (max 10MB each)
- **Video Tour**: Optional YouTube or Vimeo link
- **Amenities**: Select from 16 categorized amenities

### 3. Submission Process

1. **Validation**: All required fields are validated
2. **Image Upload**: Images are uploaded to Supabase Storage (`space-images` bucket)
3. **Database Insert**: Space data is saved to the `spaces` table
4. **Confirmation**: User is redirected to the new space listing page

## Technical Implementation

### Database Schema

The `spaces` table includes:
- **Core Info**: `id`, `host_id`, `title`, `description`, `space_type`
- **Location**: `address_line1`, `city`, `state`, `zip_code`, `latitude`, `longitude`
- **Pricing**: `price_per_hour`, `price_per_day`
- **Media**: `images[]`, `video_url`
- **Amenities**: `amenities[]`, `rules[]`
- **Status**: `is_active`, `is_featured`
- **Metadata**: `rating_average`, `view_count`, `booking_count`

### Storage Bucket

**Bucket Name**: `space-images`
**Configuration**:
- Public bucket (images are publicly accessible)
- 10MB file size limit per image
- Allowed formats: JPEG, PNG, WebP, GIF
- Folder structure: `{user_id}/{timestamp}-{index}.{ext}`

### Row Level Security (RLS)

**Spaces Table Policies**:
1. **SELECT**: Anyone can view active spaces
2. **SELECT**: Authenticated users can view all spaces
3. **ALL**: Hosts can manage their own spaces (where `auth.uid() = host_id`)

**Storage Policies**:
1. **SELECT**: Anyone can view space images (public bucket)
2. **INSERT**: Authenticated users can upload images
3. **UPDATE/DELETE**: Users can only modify their own images

### API Functions

**`createSpace(spaceData)`**:
- Located in `/lib/api/spaces.ts`
- Automatically assigns `host_id` from authenticated user
- Returns the newly created space object
- Throws error if user is not authenticated

### Form Validation

**Client-Side Validation**:
- Title: Minimum 10 characters
- Description: Minimum 50 characters
- Capacity: Must be at least 1
- ZIP Code: Must match US ZIP format (12345 or 12345-6789)
- Hourly Rate: Minimum $1
- Daily Rate: Minimum $1, typically 4x hourly rate
- Images: At least 1 image required

**Server-Side Validation**:
- Enforced by database constraints
- RLS policies prevent unauthorized access
- Foreign key constraints ensure data integrity

## Security Measures

### 1. Authentication
- All space creation requires authentication
- User ID is automatically assigned from auth session
- Cannot create spaces for other users

### 2. Authorization
- RLS policies enforce ownership
- Users can only edit/delete their own spaces
- Admins have override capabilities

### 3. Data Validation
- Input sanitization on client and server
- Type checking with TypeScript
- Database constraints prevent invalid data

### 4. Image Upload Security
- File type validation (images only)
- File size limits (10MB per image)
- Folder-based isolation (user ID in path)
- Automatic cleanup on space deletion

### 5. Privacy Protection
- Exact addresses hidden until booking confirmed
- Only general area shown to potential renters
- Host contact info protected

## Error Handling

### Common Errors

1. **Authentication Error**
   - Message: "You must be logged in to create a space listing"
   - Solution: Redirect to login page

2. **Validation Error**
   - Message: Specific field validation message
   - Solution: Display inline error, highlight field

3. **Image Upload Error**
   - Message: "Failed to upload image {n}: {error}"
   - Solution: Retry upload, reduce image size

4. **Database Error**
   - Message: "Failed to create space listing: {error}"
   - Solution: Check network, verify data format

### Error Recovery

- Form data is preserved during errors
- Users can correct issues without losing progress
- Upload progress is tracked and displayed
- Detailed error messages guide users to solutions

## Best Practices for Hosts

### Photography Tips
1. Use natural lighting when possible
2. Show multiple angles of the space
3. Highlight unique features
4. Include photos of amenities
5. Keep images high-resolution but under 10MB

### Description Guidelines
1. Be specific about space features
2. Mention nearby attractions/transit
3. Clearly state any restrictions
4. Highlight what makes your space unique
5. Use proper grammar and formatting

### Pricing Strategy
1. Research similar spaces in your area
2. Consider your costs and desired profit
3. Offer competitive daily rates
4. Adjust pricing based on demand
5. Factor in cleaning and maintenance

### Availability Management
1. Keep your calendar up to date
2. Respond quickly to booking requests
3. Set realistic availability schedules
4. Consider instant booking for better visibility
5. Block off dates for maintenance

## Future Enhancements

### Planned Features
1. **Geocoding**: Automatic latitude/longitude from address
2. **Image Optimization**: Automatic resizing and compression
3. **Draft Saving**: Save incomplete listings as drafts
4. **Bulk Upload**: Upload multiple images at once
5. **Calendar Integration**: Sync with external calendars
6. **Pricing Suggestions**: AI-powered pricing recommendations
7. **SEO Optimization**: Automatic meta tags and descriptions
8. **Social Sharing**: Share listings on social media

### Analytics
1. Track listing views
2. Monitor booking conversion rates
3. Analyze pricing effectiveness
4. Identify popular amenities
5. Measure response times

## Support

For issues or questions:
1. Check the FAQ section
2. Contact support at support@spaceongo.com
3. Visit the Help Center
4. Join the host community forum

## API Reference

### Create Space Endpoint

```typescript
async function createSpace(spaceData: SpaceInsert): Promise<Space>
```

**Parameters**:
- `spaceData`: Object containing all space information

**Returns**:
- Newly created space object with generated ID

**Throws**:
- Error if user is not authenticated
- Error if validation fails
- Error if database insert fails

### Upload Image Endpoint

```typescript
async function uploadImage(
  userId: string,
  file: File,
  index: number
): Promise<string>
```

**Parameters**:
- `userId`: Authenticated user's ID
- `file`: Image file to upload
- `index`: Image index (0-9)

**Returns**:
- Public URL of uploaded image

**Throws**:
- Error if file type is invalid
- Error if file size exceeds limit
- Error if upload fails
