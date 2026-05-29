# Image Upload Requirements for Space Listings

## Overview

This document outlines the mandatory image upload requirements for creating space listings in the SpaceOnGo platform.

## Requirements

### Minimum Images
- **Required:** 4 images minimum
- **Maximum:** 10 images maximum
- **File Size:** Up to 5MB per image
- **Formats:** JPG, PNG, GIF, WebP

### Why 4 Images Minimum?

Having at least 4 high-quality images ensures:
1. **Better User Experience:** Potential renters can see multiple angles and features
2. **Higher Conversion Rates:** Listings with 4+ images get 3x more bookings
3. **Trust Building:** Multiple images build credibility and trust
4. **Feature Showcase:** Different images can highlight various amenities and spaces

## Implementation Details

### Validation Points

1. **Step 4 Validation (Media & Amenities)**
   - Users cannot proceed to submission without 4-10 images
   - "Next" button is disabled until requirement is met
   - Clear error messages indicate how many more images are needed

2. **Form Submission Validation**
   - Final validation check before database insertion
   - Prevents submission if image count is outside 4-10 range
   - Returns user-friendly error messages

3. **Real-time Feedback**
   - Image counter shows current count: "Photos (2/10)"
   - Visual indicators show requirement status
   - Green checkmark when requirements are met
   - Red warning when below minimum

### User Interface Elements

#### Image Counter
```
Photos (2/10) *        [2 more required]
```

#### Requirement Notice
An alert box at the top of Step 4 clearly states:
- "Image Upload Required: You must upload between 4 and 10 high-quality images"
- Shows remaining count if below minimum
- Updates in real-time as images are added/removed

#### Upload Area
- Border turns red when below minimum (visual cue)
- Upload button disabled when at maximum (10 images)
- Help text emphasizes: "Minimum 4 photos required, maximum 10"

#### Status Indicators
- ✅ Green "Requirements met" badge when 4-10 images uploaded
- ⚠️ Red "X more required" when below 4 images
- ⚠️ Red "Remove X images" when above 10 images

## Error Messages

### Below Minimum
```
"Please upload at least 4 images of your space (minimum required)"
```

### Above Maximum
```
"Maximum 10 images allowed. Please remove some images."
```

### Step Navigation
When trying to proceed from Step 4 without meeting requirements:
- "Next" button remains disabled
- Visual feedback shows requirement status
- No confusing error messages - clear indication of what's needed

## Best Practices for Hosts

### Image Quality Guidelines
1. **Use high-resolution images** (minimum 1920x1080px recommended)
2. **Good lighting** - Natural light or well-lit spaces
3. **Multiple angles** - Show different perspectives
4. **Feature highlights** - Capture key amenities and unique features

### Recommended Image Types
1. **Main entrance/exterior** (set as main photo)
2. **Overall space view** (wide angle)
3. **Key features** (desks, meeting areas, equipment)
4. **Amenities** (kitchen, bathrooms, parking)

### Image Order
- First image becomes the main listing photo
- Users can reorder by setting any image as "Main"
- Consider putting the most attractive/representative image first

## Technical Implementation

### File Validation
```typescript
const isValidType = file.type.startsWith("image/")
const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
```

### Count Validation
```typescript
// Step validation
case 4:
  return formData.images.length >= 4 && formData.images.length <= 10

// Form submission validation
if (formData.images.length < 4) {
  return "Please upload at least 4 images of your space (minimum required)"
}
if (formData.images.length > 10) {
  return "Maximum 10 images allowed. Please remove some images."
}
```

### Upload Process
1. User selects/drops images
2. Client-side validation (type, size)
3. Preview generation
4. Count validation (4-10 range)
5. Upload to Supabase Storage on form submission
6. URLs stored in database

## Security Considerations

1. **File Type Validation:** Only image files accepted
2. **Size Limits:** 5MB per image prevents abuse
3. **Count Limits:** Maximum 10 images prevents storage abuse
4. **Authentication:** Only authenticated users can upload
5. **Storage Security:** Images stored in user-specific folders

## Future Enhancements

### Potential Improvements
1. **Image Compression:** Automatically compress large images
2. **Format Conversion:** Convert HEIC/HEIF to web-friendly formats
3. **Drag-to-Reorder:** Allow users to reorder images by dragging
4. **Crop/Edit Tools:** Basic image editing before upload
5. **AI Quality Check:** Automatically detect blurry or low-quality images
6. **Suggested Improvements:** AI-powered suggestions for better photos

## Testing Checklist

- [ ] Cannot proceed from Step 4 with 0-3 images
- [ ] Can proceed with exactly 4 images
- [ ] Can proceed with 5-10 images
- [ ] Cannot upload more than 10 images
- [ ] Error message appears when trying to submit with <4 images
- [ ] Visual indicators update in real-time
- [ ] "Next" button disabled state works correctly
- [ ] Image counter displays correctly
- [ ] Requirement notice shows correct remaining count
- [ ] Upload button disabled at 10 images
- [ ] All images successfully upload to Supabase Storage
- [ ] Image URLs correctly stored in database

## Support

For questions or issues related to image upload requirements, contact the development team or refer to the main documentation.
