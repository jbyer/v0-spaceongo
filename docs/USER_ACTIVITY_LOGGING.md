# User Activity Logging System

## Overview

The user activity logging system provides comprehensive tracking of all user interactions within the SpaceOnGo dashboard environment. This system enables security monitoring, user behavior analysis, and audit trail maintenance.

## Database Schema

### Table: `user_activities`

The `user_activities` table stores detailed information about every user action in the dashboard.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to profiles table |
| `username` | TEXT | Denormalized username for quick access |
| `activity_type` | TEXT | Categorized type of activity |
| `activity_description` | TEXT | Human-readable description |
| `metadata` | JSONB | Flexible JSON for activity-specific data |
| `ip_address` | INET | User's IP address |
| `user_agent` | TEXT | Browser/device information |
| `device_type` | TEXT | desktop, mobile, tablet, unknown |
| `browser` | TEXT | Browser name |
| `operating_system` | TEXT | OS name |
| `country` | TEXT | User's country |
| `city` | TEXT | User's city |
| `is_suspicious` | BOOLEAN | Flag for security monitoring |
| `is_admin_action` | BOOLEAN | Flag for admin actions |
| `created_at` | TIMESTAMPTZ | Timestamp of activity |

#### Activity Types

The system supports the following activity types:

- `login` - User logged in
- `logout` - User logged out
- `profile_update` - Profile information updated
- `space_created` - New space listing created
- `space_updated` - Space listing updated
- `space_deleted` - Space listing deleted
- `booking_created` - New booking made
- `booking_cancelled` - Booking cancelled
- `review_posted` - Review posted
- `message_sent` - Message sent
- `favorite_added` - Space added to favorites
- `favorite_removed` - Space removed from favorites
- `blog_post_created` - Blog post created
- `blog_post_updated` - Blog post updated
- `settings_changed` - Settings modified
- `password_changed` - Password changed
- `email_changed` - Email address changed
- `payment_method_added` - Payment method added
- `payout_received` - Payout received
- `admin_action` - Administrative action
- `other` - Other activities

## Indexes

The table includes several indexes for optimal query performance:

1. **Single Column Indexes:**
   - `idx_user_activities_user_id` - Fast user-specific queries
   - `idx_user_activities_created_at` - Time-based queries
   - `idx_user_activities_activity_type` - Filter by activity type
   - `idx_user_activities_username` - Username lookups
   - `idx_user_activities_is_suspicious` - Security monitoring

2. **Composite Indexes:**
   - `idx_user_activities_user_time` - User activity timeline
   - `idx_user_activities_type_time` - Activity type timeline
   - `idx_user_activities_user_type` - User + activity type

3. **GIN Index:**
   - `idx_user_activities_metadata` - JSONB metadata queries

## Row Level Security (RLS)

The table implements comprehensive RLS policies:

1. **Users can view their own activities** - Users can only see their own activity logs
2. **Admins can view all activities** - Admins and superusers can view all user activities
3. **Service role can insert activities** - Only server-side code can insert activities
4. **Admins can update activity flags** - Admins can mark activities as suspicious
5. **Superusers can delete activities** - Only superusers can delete activities (for compliance)

## API Functions

### `logUserActivity()`

Logs a user activity to the database.

```typescript
await logUserActivity(
  userId,
  "space_created",
  "Created new space: Downtown Studio",
  { spaceId: "123", spaceTitle: "Downtown Studio" }
)
```

### `getUserActivities()`

Gets paginated user activities.

```typescript
const { activities, total } = await getUserActivities(userId, 1, 20)
```

### `getRecentActivities()`

Gets recent activities for dashboard display.

```typescript
const { activities } = await getRecentActivities(userId, 10)
```

### `getUserActivitySummary()`

Gets activity summary for analytics.

```typescript
const { summary } = await getUserActivitySummary(userId, 30)
```

### `getAllActivities()`

Gets all activities (admin only) with filtering.

```typescript
const { activities, total } = await getAllActivities(1, 50, {
  activityType: "login",
  startDate: "2025-01-01",
})
```

## Database Functions

### `log_user_activity()`

Server-side function for logging activities with automatic username resolution.

```sql
SELECT log_user_activity(
  'user-uuid',
  'login',
  'User logged in from Chrome on Windows',
  '{"browser": "Chrome", "os": "Windows"}'::jsonb,
  '192.168.1.1'::inet,
  'Mozilla/5.0...'
);
```

### `get_user_activity_summary()`

Gets aggregated activity summary for a user.

```sql
SELECT * FROM get_user_activity_summary('user-uuid', 30);
```

## Views

### `recent_user_activities`

Pre-joined view of activities from the last 30 days with user profile information.

```sql
SELECT * FROM recent_user_activities WHERE user_id = 'user-uuid';
```

## Usage Examples

### Logging Activities in Server Actions

```typescript
// app/actions/spaces.ts
"use server"

import { logUserActivity } from "@/lib/api/activities"

export async function createSpace(formData: FormData) {
  // ... create space logic ...
  
  await logUserActivity(
    userId,
    "space_created",
    `Created new space: ${spaceTitle}`,
    {
      spaceId: newSpace.id,
      spaceTitle: spaceTitle,
      spaceType: spaceType,
    }
  )
}
```

### Displaying Activities in Dashboard

```typescript
// components/user-activity-feed.tsx
"use client"

import { useEffect, useState } from "react"
import { getRecentActivities } from "@/lib/api/activities"

export function UserActivityFeed({ userId }: { userId: string }) {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    async function loadActivities() {
      const { activities } = await getRecentActivities(userId, 10)
      setActivities(activities)
    }
    loadActivities()
  }, [userId])

  return (
    <div>
      {activities.map((activity) => (
        <div key={activity.id}>
          <p>{activity.activity_description}</p>
          <time>{new Date(activity.created_at).toLocaleString()}</time>
        </div>
      ))}
    </div>
  )
}
```

## Security Considerations

1. **Server-Side Only Inserts** - Activities can only be inserted via service role or server-side code
2. **User Privacy** - Users can only view their own activities
3. **Admin Oversight** - Admins can view all activities for monitoring
4. **Suspicious Activity Flagging** - System can flag suspicious patterns
5. **Audit Trail** - Complete history of user actions for compliance

## Performance Optimization

1. **Indexed Queries** - All common query patterns are indexed
2. **Partitioning** - Consider partitioning by date for large datasets
3. **Archiving** - Implement data retention policy to archive old activities
4. **Caching** - Cache recent activities for dashboard display

## Data Retention

Recommended retention policy:

- **Active Data**: Last 90 days in main table
- **Archive**: 90 days - 2 years in archive table
- **Deletion**: After 2 years (or per compliance requirements)

## Compliance

The activity logging system supports:

- **GDPR** - User data access and deletion rights
- **SOC 2** - Audit trail requirements
- **HIPAA** - Access logging (if applicable)
- **PCI DSS** - Payment activity tracking

## Future Enhancements

1. **Real-time Activity Streaming** - WebSocket-based live activity feed
2. **Anomaly Detection** - ML-based suspicious activity detection
3. **Activity Analytics Dashboard** - Visual analytics for user behavior
4. **Export Functionality** - Export activities for external analysis
5. **Activity Replay** - Replay user sessions for debugging
