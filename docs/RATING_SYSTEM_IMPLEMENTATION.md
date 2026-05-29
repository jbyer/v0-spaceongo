# Rating and Review System Implementation Guide

## Overview
This document outlines the complete implementation of the star rating and feedback system for SpaceOnGo bookings.

## Database Schema

The `reviews` table already exists with the following structure:
- `id` (UUID) - Primary key
- `booking_id` (UUID) - Reference to bookings table
- `space_id` (UUID) - Reference to spaces table
- `reviewer_id` (UUID) - User who wrote the review (guest)
- `reviewee_id` (UUID) - User being reviewed (host)
- `rating` (INTEGER) - Star rating (1-5)
- `title` (TEXT) - Optional review title
- `comment` (TEXT) - Review feedback text
- `review_type` (TEXT) - Type: 'space_review', 'guest_to_host', 'host_to_guest'
- `is_public` (BOOLEAN) - Whether review is publicly visible
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## Implementation Components

### 1. Rating Modal Component (`components/rating-modal.tsx`)

**Features:**
- Interactive 5-star rating system
- Hover effects for rating selection
- Feedback textarea with character limit (1000 chars)
- Form validation
- Loading states during submission
- Error handling and display

**Props:**
- `isOpen` - Controls modal visibility
- `onClose` - Handler for closing modal
- `bookingId` - ID of the booking being reviewed
- `spaceId` - ID of the space being reviewed
- `spaceTitle` - Display name of the space
- `hostId` - ID of the space host
- `onSuccess` - Callback after successful submission

**Validation:**
- Rating must be between 1-5
- Feedback must be at least 10 characters
- Checks for duplicate reviews
- User must be authenticated

### 2. My Bookings Page Updates (`app/dashboard/bookings/page.tsx`)

**Changes:**
- Added "Rate Space" button for past bookings
- Replaced "View Details" button in past bookings tab
- Added state management for rating modal
- Integrated RatingModal component
- Refresh bookings list after review submission

**UI Flow:**
1. User navigates to My Bookings page
2. Clicks on "Past" tab
3. Sees completed bookings with "Rate Space" button
4. Clicks button to open rating modal
5. Submits rating and feedback
6. Modal closes and bookings refresh

### 3. Space Detail Page Updates (`app/space/[id]/page.tsx`)

**Changes:**
- Filter reviews by `review_type = 'space_review'`
- Only display public space reviews
- Existing ReviewSystem component already handles display

**Display Location:**
- Main reviews section in left column
- Reviews summary in right sidebar
- Only shown when reviews exist

## User Flow

### Submitting a Review

1. **Prerequisite:** User must have a past booking (end_date < current date)
2. **Access:** Navigate to Dashboard → My Bookings → Past tab
3. **Action:** Click "Rate Space" button on a past booking
4. **Modal Opens:**
   - Select star rating (1-5)
   - Enter detailed feedback (min 10 chars)
   - Submit or cancel
5. **Validation:**
   - System checks for existing review
   - Validates rating and feedback
   - Prevents duplicate submissions
6. **Success:**
   - Review saved to database
   - Modal closes
   - Bookings list refreshes
   - Space rating_average and rating_count update automatically (via trigger)

### Viewing Reviews

1. **Public View:** Any user visiting a space detail page
2. **Location:** Scroll to "Reviews" section
3. **Display:**
   - Average rating and total count
   - Individual reviews with ratings and comments
   - Reviewer name and date
   - Sorted by most recent first

## Database Triggers

The existing `update_space_ratings` trigger automatically:
- Recalculates space average rating
- Updates review count
- Runs on INSERT, UPDATE, DELETE of reviews

## Row Level Security (RLS)

Existing policies ensure:
- Anyone can view public reviews
- Users can only create reviews for their own bookings
- Users can view reviews they wrote
- Hosts can view reviews about their spaces

## API Endpoints

No new API endpoints required. Uses existing Supabase client operations:
- Insert review: `supabase.from('reviews').insert(...)`
- Fetch reviews: `supabase.from('reviews').select(...)`
- Check duplicates: `supabase.from('reviews').select(...).single()`

## Testing Checklist

- [ ] User can open rating modal from past bookings
- [ ] Star rating selection works correctly
- [ ] Hover effects display properly
- [ ] Form validation prevents empty submissions
- [ ] Duplicate review prevention works
- [ ] Review saves successfully to database
- [ ] Reviews display on space detail page
- [ ] Space rating_average updates automatically
- [ ] Only past bookings show "Rate Space" button
- [ ] Upcoming/current bookings show "View Details"
- [ ] Modal closes after successful submission
- [ ] Error messages display clearly

## Future Enhancements

Potential improvements:
- Add review title field
- Allow users to edit their reviews
- Add review moderation for hosts
- Enable photo uploads with reviews
- Add helpful/unhelpful voting on reviews
- Filter reviews by rating
- Show verified booking badge on reviews
- Send email notifications when reviews are posted
