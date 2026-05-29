# SpaceOnGo Database Schema - Comprehensive Plan

## Executive Summary

This document outlines the complete database architecture for the SpaceOnGo platform, a space rental marketplace connecting hosts with guests seeking temporary spaces for events, meetings, creative work, and more.

## Current Implementation Status

### ✅ Implemented Tables (13 Core Tables)

#### 1. **profiles** - User Account Management
**Purpose**: Extended user information beyond Supabase auth.users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, FK to auth.users | User identifier |
| email | TEXT | NOT NULL | User email address |
| first_name | TEXT | - | User's first name |
| last_name | TEXT | - | User's last name |
| display_name | TEXT | - | Public display name |
| bio | TEXT | - | User biography |
| phone | TEXT | - | Contact phone number |
| profile_image_url | TEXT | - | Profile photo URL |
| address_line1 | TEXT | - | Street address |
| address_line2 | TEXT | - | Apartment/suite number |
| city | TEXT | - | City |
| state | TEXT | - | State/province |
| zip_code | TEXT | - | Postal code |
| country | TEXT | DEFAULT 'United States' | Country |
| neighbor | TEXT | - | Neighborhood |
| website_url | TEXT | - | Personal website |
| linkedin_url | TEXT | - | LinkedIn profile |
| twitter_url | TEXT | - | Twitter/X profile |
| instagram_url | TEXT | - | Instagram profile |
| facebook_url | TEXT | - | Facebook profile |
| airbnb_url | TEXT | - | Airbnb profile |
| pinterest_url | TEXT | - | Pinterest profile |
| payout_method | TEXT | CHECK constraint | Payment method (paypal, skrill, wire_transfer) |
| payout_details | JSONB | - | Payment account details |
| is_host | BOOLEAN | DEFAULT FALSE | Host status flag |
| is_admin | BOOLEAN | DEFAULT FALSE | Admin role flag |
| is_superuser | BOOLEAN | DEFAULT FALSE | Superuser role flag |
| stripe_customer_id | TEXT | UNIQUE | Stripe customer identifier |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes**: None (small table, primary key sufficient)

**Relationships**:
- References auth.users(id) with CASCADE delete
- Referenced by spaces, bookings, reviews, favorites, messages, notifications

**RLS Policies**:
- Users can view/update their own profile
- All authenticated users can view public profiles

---

#### 2. **space_categories** - Space Type Classification
**Purpose**: Categorize spaces for filtering and organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Category identifier |
| name | TEXT | NOT NULL, UNIQUE | Category name |
| slug | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| description | TEXT | - | Category description |
| icon_name | TEXT | - | Icon identifier for UI |
| image_url | TEXT | - | Category image |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Default Categories**:
1. Event Spaces
2. Meeting Rooms
3. Creative Studios
4. Coworking Spaces
5. Fitness Studios
6. Production Studios
7. Pop-up Retail
8. Workshop Spaces

**Indexes**: slug (unique constraint provides index)

**Relationships**:
- Referenced by spaces table

**RLS Policies**:
- Public read access
- Admin-only write access

---

#### 3. **spaces** - Space Listings
**Purpose**: Core table for rental space listings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Space identifier |
| host_id | UUID | NOT NULL, FK to profiles | Space owner |
| title | TEXT | NOT NULL | Space title |
| description | TEXT | NOT NULL | Full description |
| short_description | TEXT | - | Brief summary |
| category_id | UUID | FK to space_categories | Space category |
| space_type | TEXT | NOT NULL | Specific space type |
| address_line1 | TEXT | NOT NULL | Street address |
| address_line2 | TEXT | - | Additional address info |
| city | TEXT | NOT NULL | City |
| state | TEXT | NOT NULL | State/province |
| zip_code | TEXT | NOT NULL | Postal code |
| country | TEXT | DEFAULT 'United States' | Country |
| latitude | DECIMAL(10,8) | - | GPS latitude |
| longitude | DECIMAL(11,8) | - | GPS longitude |
| price_per_hour | DECIMAL(10,2) | - | Hourly rate |
| price_per_day | DECIMAL(10,2) | - | Daily rate |
| capacity | INTEGER | - | Maximum occupancy |
| size_sqft | INTEGER | - | Space size in square feet |
| amenities | TEXT[] | - | Array of amenities |
| rules | TEXT[] | - | Array of house rules |
| images | TEXT[] | - | Array of image URLs |
| video_url | TEXT | - | Video tour URL |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured listing flag |
| is_active | BOOLEAN | DEFAULT TRUE | Active listing flag |
| availability_schedule | JSONB | - | Availability calendar |
| instant_book | BOOLEAN | DEFAULT FALSE | Instant booking enabled |
| minimum_booking_hours | INTEGER | DEFAULT 1 | Minimum booking duration |
| maximum_booking_hours | INTEGER | - | Maximum booking duration |
| cancellation_policy | TEXT | DEFAULT 'flexible' | Cancellation terms |
| rating_average | DECIMAL(3,2) | DEFAULT 0 | Average rating (0-5) |
| rating_count | INTEGER | DEFAULT 0 | Number of reviews |
| view_count | INTEGER | DEFAULT 0 | Page view counter |
| booking_count | INTEGER | DEFAULT 0 | Total bookings |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- host_id
- category_id
- is_featured
- is_active
- (city, state) composite

**Relationships**:
- References profiles(host_id)
- References space_categories(category_id)
- Referenced by bookings, reviews, favorites

**RLS Policies**:
- Public can view active spaces
- Hosts can manage their own spaces
- Authenticated users can view all spaces

---

#### 4. **bookings** - Reservation Management
**Purpose**: Track space reservations and rental periods

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Booking identifier |
| space_id | UUID | NOT NULL, FK to spaces | Booked space |
| guest_id | UUID | NOT NULL, FK to profiles | Guest making booking |
| host_id | UUID | NOT NULL, FK to profiles | Space host |
| start_date | TIMESTAMPTZ | NOT NULL | Booking start time |
| end_date | TIMESTAMPTZ | NOT NULL | Booking end time |
| total_hours | INTEGER | NOT NULL | Duration in hours |
| price_per_hour | DECIMAL(10,2) | NOT NULL | Hourly rate at booking |
| total_amount | DECIMAL(10,2) | NOT NULL | Subtotal |
| service_fee | DECIMAL(10,2) | DEFAULT 0 | Platform service fee |
| tax_amount | DECIMAL(10,2) | DEFAULT 0 | Tax amount |
| final_amount | DECIMAL(10,2) | NOT NULL | Total amount charged |
| status | TEXT | NOT NULL, CHECK constraint | Booking status |
| payment_status | TEXT | NOT NULL, CHECK constraint | Payment status |
| payment_intent_id | TEXT | - | Stripe payment intent ID |
| special_requests | TEXT | - | Guest special requests |
| guest_count | INTEGER | DEFAULT 1 | Number of guests |
| cancellation_reason | TEXT | - | Cancellation reason |
| cancelled_at | TIMESTAMPTZ | - | Cancellation timestamp |
| cancelled_by | UUID | FK to profiles | User who cancelled |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Status Values**: pending, confirmed, cancelled, completed, refunded
**Payment Status Values**: pending, paid, failed, refunded

**Indexes**:
- space_id
- guest_id
- host_id
- status
- (start_date, end_date) composite

**Relationships**:
- References spaces(space_id)
- References profiles(guest_id, host_id, cancelled_by)
- Referenced by reviews, messages, payments

**RLS Policies**:
- Guests can view/update their bookings
- Hosts can view/update bookings for their spaces
- Guests can create bookings

---

#### 5. **reviews** - Rating and Review System
**Purpose**: Collect feedback from guests and hosts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Review identifier |
| booking_id | UUID | NOT NULL, FK to bookings | Associated booking |
| space_id | UUID | NOT NULL, FK to spaces | Reviewed space |
| reviewer_id | UUID | NOT NULL, FK to profiles | User writing review |
| reviewee_id | UUID | NOT NULL, FK to profiles | User being reviewed |
| rating | INTEGER | NOT NULL, CHECK (1-5) | Star rating |
| title | TEXT | - | Review title |
| comment | TEXT | - | Review text |
| review_type | TEXT | NOT NULL, CHECK constraint | Review type |
| is_public | BOOLEAN | DEFAULT TRUE | Public visibility flag |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Review Types**: guest_to_host, host_to_guest, space_review

**Indexes**:
- space_id

**Relationships**:
- References bookings(booking_id)
- References spaces(space_id)
- References profiles(reviewer_id, reviewee_id)

**Triggers**:
- Auto-updates space rating_average and rating_count

**RLS Policies**:
- Public can view public reviews
- Users can create reviews for their bookings
- Users can view reviews they wrote or received

---

#### 6. **favorites** - Saved Spaces
**Purpose**: Allow users to save spaces for later

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Favorite identifier |
| user_id | UUID | NOT NULL, FK to profiles | User who favorited |
| space_id | UUID | NOT NULL, FK to spaces | Favorited space |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique Constraint**: (user_id, space_id)

**Indexes**:
- user_id

**Relationships**:
- References profiles(user_id)
- References spaces(space_id)

**RLS Policies**:
- Users can manage their own favorites

---

#### 7. **messages** - User Communication
**Purpose**: Enable messaging between users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Message identifier |
| booking_id | UUID | FK to bookings | Related booking (optional) |
| sender_id | UUID | NOT NULL, FK to profiles | Message sender |
| recipient_id | UUID | NOT NULL, FK to profiles | Message recipient |
| subject | TEXT | - | Message subject |
| content | TEXT | NOT NULL | Message body |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| message_type | TEXT | CHECK constraint | Message category |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Message Types**: general, booking_inquiry, booking_update, system

**Indexes**:
- recipient_id

**Relationships**:
- References bookings(booking_id)
- References profiles(sender_id, recipient_id)

**RLS Policies**:
- Users can view messages they sent or received
- Users can send messages
- Recipients can update read status

---

#### 8. **notifications** - System Notifications
**Purpose**: Notify users of important events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Notification identifier |
| user_id | UUID | NOT NULL, FK to profiles | Notification recipient |
| title | TEXT | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| type | TEXT | NOT NULL, CHECK constraint | Notification type |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| action_url | TEXT | - | Link to related content |
| metadata | JSONB | - | Additional data |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Notification Types**: booking, review, message, system, payment

**Indexes**:
- user_id

**Relationships**:
- References profiles(user_id)

**RLS Policies**:
- Users can view/update their own notifications
- System can create notifications

---

#### 9. **blog_posts** - Content Management
**Purpose**: Manage blog content

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Post identifier |
| author_id | UUID | NOT NULL, FK to profiles | Post author |
| title | TEXT | NOT NULL | Post title |
| slug | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| excerpt | TEXT | - | Brief summary |
| content | TEXT | NOT NULL | Full post content |
| featured_image_url | TEXT | - | Header image |
| category | TEXT | NOT NULL | Post category |
| tags | TEXT[] | - | Array of tags |
| status | TEXT | NOT NULL, CHECK constraint | Publication status |
| published_at | TIMESTAMPTZ | - | Publication timestamp |
| view_count | INTEGER | DEFAULT 0 | Page view counter |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Status Values**: draft, published, archived

**Indexes**:
- status
- slug (unique constraint provides index)

**Relationships**:
- References profiles(author_id)
- Referenced by blog_comments

**RLS Policies**:
- Public can view published posts
- Authors can manage their own posts
- Admins can manage all posts

---

#### 10. **blog_comments** - Blog Engagement
**Purpose**: Allow comments on blog posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Comment identifier |
| post_id | UUID | NOT NULL, FK to blog_posts | Associated post |
| author_name | TEXT | NOT NULL | Commenter name |
| author_email | TEXT | NOT NULL | Commenter email |
| content | TEXT | NOT NULL | Comment text |
| is_approved | BOOLEAN | DEFAULT FALSE | Moderation status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes**: None (small table)

**Relationships**:
- References blog_posts(post_id)

**RLS Policies**:
- Public can view approved comments
- Anyone can create comments
- Admins can manage all comments

---

#### 11. **payments** - Payment Tracking
**Purpose**: Track Stripe payment transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Payment identifier |
| user_id | UUID | FK to auth.users | User making payment |
| booking_id | UUID | FK to bookings | Associated booking |
| space_id | UUID | FK to spaces | Associated space |
| stripe_payment_intent_id | TEXT | UNIQUE | Stripe payment intent |
| stripe_customer_id | TEXT | - | Stripe customer ID |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| currency | TEXT | DEFAULT 'usd' | Currency code |
| status | TEXT | NOT NULL, CHECK constraint | Payment status |
| metadata | JSONB | DEFAULT '{}' | Additional data |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Status Values**: pending, succeeded, failed, canceled, refunded

**Indexes**:
- user_id
- booking_id
- status
- created_at

**Relationships**:
- References auth.users(user_id)
- References bookings(booking_id)
- References spaces(space_id)

**RLS Policies**:
- Users can view their own payments
- Admins can view/update all payments

---

#### 12. **subscriptions** - Subscription Management
**Purpose**: Track recurring subscriptions (future feature)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Subscription identifier |
| user_id | UUID | FK to auth.users | Subscriber |
| stripe_subscription_id | TEXT | UNIQUE, NOT NULL | Stripe subscription ID |
| stripe_customer_id | TEXT | - | Stripe customer ID |
| status | TEXT | NOT NULL | Subscription status |
| current_period_start | TIMESTAMPTZ | - | Billing period start |
| current_period_end | TIMESTAMPTZ | - | Billing period end |
| canceled_at | TIMESTAMPTZ | - | Cancellation timestamp |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- user_id
- status

**Relationships**:
- References auth.users(user_id)

**RLS Policies**:
- Users can view their own subscriptions
- Admins can view/update all subscriptions

---

#### 13. **admin_settings** - System Configuration
**Purpose**: Store application-wide settings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Setting identifier |
| setting_key | TEXT | NOT NULL, UNIQUE | Setting name |
| setting_value | TEXT | NOT NULL | Setting value |
| description | TEXT | - | Setting description |
| updated_by | UUID | FK to profiles | Last updater |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Default Settings**:
- featured_spaces_count: 6
- all_spaces_per_page: 12
- site_maintenance_mode: false
- booking_service_fee_percent: 3.0
- max_booking_hours: 168

**Indexes**: setting_key (unique constraint provides index)

**Relationships**:
- References profiles(updated_by)

**RLS Policies**:
- Admin-only access

---

## Database Functions and Triggers

### 1. **handle_new_user()** - Auto-create Profile
**Purpose**: Automatically create a profile when a user signs up

**Trigger**: AFTER INSERT on auth.users

**Logic**:
- Extracts user metadata from auth.users
- Creates profile record with email and name
- Sets display_name from metadata or email prefix

---

### 2. **update_updated_at_column()** - Timestamp Maintenance
**Purpose**: Automatically update updated_at timestamps

**Applied to**: profiles, spaces, bookings, reviews, blog_posts

**Logic**:
- Sets updated_at to NOW() on every UPDATE

---

### 3. **update_space_rating()** - Rating Aggregation
**Purpose**: Maintain accurate space ratings

**Triggers**: AFTER INSERT/UPDATE/DELETE on reviews

**Logic**:
- Calculates average rating from space_review type reviews
- Updates spaces.rating_average and rating_count
- Only includes public reviews

---

## Security Architecture

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:

1. **User Data Isolation**: Users can only access their own data
2. **Public Data Access**: Active spaces and published content are public
3. **Role-Based Access**: Admin/superuser roles have elevated permissions
4. **Relationship-Based Access**: Users can access data related to their bookings

### Key Security Features

- **CASCADE Deletes**: User deletion removes all related data
- **CHECK Constraints**: Enforce valid enum values
- **UNIQUE Constraints**: Prevent duplicate entries
- **Foreign Keys**: Maintain referential integrity
- **JSONB Validation**: Structured data in flexible fields

---

## Performance Optimization

### Indexing Strategy

**High-Traffic Queries**:
- Space searches by location, category, status
- Booking lookups by user, space, date range
- Message/notification retrieval by recipient
- Payment history by user

**Composite Indexes**:
- (city, state) for location searches
- (start_date, end_date) for availability checks

**Unique Indexes**:
- Email, slug, stripe IDs for fast lookups

---

## Scalability Considerations

### Current Capacity

The schema supports:
- Unlimited users, spaces, and bookings
- Complex search and filtering
- Real-time messaging and notifications
- Multi-currency payments
- Content management system

### Future Enhancements

#### Recommended Additional Tables

1. **space_availability** - Granular availability tracking
2. **saved_searches** - User search preferences
3. **space_amenities** - Normalized amenity catalog
4. **pricing_rules** - Dynamic pricing engine
5. **promotions** - Discount and coupon system
6. **disputes** - Conflict resolution tracking
7. **insurance_claims** - Damage/incident tracking
8. **analytics_events** - User behavior tracking
9. **email_templates** - Transactional email management
10. **api_keys** - Third-party integration management

---

## Data Integrity

### Normalization Level

**3rd Normal Form (3NF)** achieved:
- No transitive dependencies
- All non-key attributes depend on primary key
- Minimal data redundancy

### Denormalization for Performance

Strategic denormalization in:
- **spaces.rating_average/rating_count**: Cached from reviews
- **bookings.host_id**: Duplicated from spaces for query performance
- **profiles.stripe_customer_id**: Cached from Stripe API

---

## Migration Strategy

### Existing Scripts

1. **001_create_database_schema.sql** - Core tables and relationships
2. **002_enable_row_level_security.sql** - Security policies
3. **003_create_profile_trigger.sql** - Auto-profile creation
4. **004_create_rating_update_function.sql** - Rating aggregation
5. **005_create_payments_table.sql** - Payment tracking

### Future Migration Best Practices

- **Version numbering**: Sequential script naming
- **Idempotent operations**: Use IF NOT EXISTS
- **Rollback scripts**: Create reverse migrations
- **Data preservation**: Never DROP tables with data
- **Testing**: Validate on staging before production

---

## Monitoring and Maintenance

### Recommended Monitoring

1. **Query Performance**: Slow query log analysis
2. **Index Usage**: Identify unused indexes
3. **Table Growth**: Monitor storage consumption
4. **RLS Performance**: Ensure policies are efficient
5. **Connection Pooling**: Optimize concurrent access

### Maintenance Tasks

1. **VACUUM**: Regular table cleanup
2. **ANALYZE**: Update query planner statistics
3. **Index Rebuild**: Periodic index optimization
4. **Backup Strategy**: Daily automated backups
5. **Audit Logs**: Track schema changes

---

## API Integration Points

### Supabase Features Used

- **Authentication**: auth.users table integration
- **Storage**: Profile images and space photos
- **Real-time**: Future feature for live messaging
- **Edge Functions**: Webhook processing
- **PostgREST**: Auto-generated REST API

### External Integrations

- **Stripe**: Payment processing
- **Google Maps**: Geocoding and mapping
- **Email Service**: Transactional emails (future)
- **SMS Service**: Phone verification (future)

---

## Conclusion

The SpaceOnGo database schema is production-ready with:

- **13 core tables** covering all essential features
- **Comprehensive RLS policies** for data security
- **Optimized indexes** for query performance
- **Automated triggers** for data consistency
- **Scalable architecture** for future growth

The schema follows PostgreSQL best practices, maintains data integrity through foreign keys and constraints, and provides a solid foundation for a marketplace platform handling complex booking workflows, payments, and user interactions.
