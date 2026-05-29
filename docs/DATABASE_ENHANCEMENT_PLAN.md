# Database Enhancement Plan - Phase 2

## Overview

This document outlines recommended enhancements to the SpaceOnGo database schema to support advanced features, improve performance, and enable future scalability.

---

## Phase 2A: Enhanced Availability Management

### 1. **space_availability_blocks** Table

**Purpose**: Granular control over space availability

```sql
CREATE TABLE IF NOT EXISTS public.space_availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  reason TEXT, -- 'blocked', 'maintenance', 'personal_use'
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent overlapping blocks
  CONSTRAINT no_overlap EXCLUDE USING gist (
    space_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

CREATE INDEX idx_availability_space_time ON public.space_availability_blocks(space_id, start_time, end_time);
```

**Benefits**:
- Hosts can block specific time periods
- Prevents double-booking at database level
- Supports maintenance windows
- Enables recurring availability patterns

---

### 2. **space_pricing_rules** Table

**Purpose**: Dynamic pricing based on time, demand, or events

```sql
CREATE TABLE IF NOT EXISTS public.space_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('time_of_day', 'day_of_week', 'seasonal', 'demand_based', 'event_based')),
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  days_of_week INTEGER[], -- 0=Sunday, 6=Saturday
  price_modifier_type TEXT CHECK (price_modifier_type IN ('percentage', 'fixed_amount')),
  price_modifier_value DECIMAL(10,2) NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher priority rules override lower
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_space ON public.space_pricing_rules(space_id, is_active);
```

**Use Cases**:
- Weekend premium pricing
- Off-peak discounts
- Holiday pricing
- Early bird discounts
- Last-minute deals

---

## Phase 2B: Advanced Search and Discovery

### 3. **saved_searches** Table

**Purpose**: Allow users to save and receive alerts for searches

```sql
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  search_criteria JSONB NOT NULL, -- {location, category, price_range, amenities, etc.}
  alert_frequency TEXT CHECK (alert_frequency IN ('instant', 'daily', 'weekly', 'never')),
  last_alerted_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user ON public.saved_searches(user_id, is_active);
CREATE INDEX idx_saved_searches_criteria ON public.saved_searches USING gin(search_criteria);
```

**Benefits**:
- Users can monitor specific searches
- Email alerts for new matching spaces
- Improved user retention
- Market demand insights

---

### 4. **space_amenities** Table (Normalized)

**Purpose**: Standardize amenities for better filtering

```sql
CREATE TABLE IF NOT EXISTS public.space_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'technology', 'furniture', 'accessibility', 'kitchen', 'outdoor'
  icon_name TEXT,
  description TEXT,
  is_premium BOOLEAN DEFAULT FALSE, -- Premium amenities for featured listings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.space_amenity_links (
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.space_amenities(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1, -- e.g., "4 monitors"
  notes TEXT,
  PRIMARY KEY (space_id, amenity_id)
);

CREATE INDEX idx_amenity_links_space ON public.space_amenity_links(space_id);
CREATE INDEX idx_amenity_links_amenity ON public.space_amenity_links(amenity_id);
```

**Benefits**:
- Consistent amenity naming
- Advanced filtering by amenity category
- Quantity tracking (e.g., "10 chairs")
- Easier to add new amenities

---

## Phase 2C: Marketing and Promotions

### 5. **promotions** Table

**Purpose**: Discount codes and promotional campaigns

```sql
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_hours')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_booking_amount DECIMAL(10,2),
  maximum_discount_amount DECIMAL(10,2),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER, -- Total uses allowed
  usage_per_user INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  applicable_to TEXT CHECK (applicable_to IN ('all', 'specific_spaces', 'specific_categories', 'new_users')),
  space_ids UUID[], -- If applicable_to = 'specific_spaces'
  category_ids UUID[], -- If applicable_to = 'specific_categories'
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotion_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promotions_code ON public.promotions(code, is_active);
CREATE INDEX idx_promotion_usage_user ON public.promotion_usage(user_id);
```

**Benefits**:
- Flexible discount campaigns
- Referral programs
- First-time user incentives
- Seasonal promotions
- Usage tracking and analytics

---

## Phase 2D: Trust and Safety

### 6. **disputes** Table

**Purpose**: Handle booking conflicts and issues

```sql
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id),
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('cancellation', 'damage', 'no_show', 'cleanliness', 'safety', 'other')),
  description TEXT NOT NULL,
  evidence_urls TEXT[], -- Photos, documents
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disputes_booking ON public.disputes(booking_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
```

**Benefits**:
- Structured conflict resolution
- Evidence tracking
- Admin oversight
- Refund management
- Trust and safety metrics

---

### 7. **user_verifications** Table

**Purpose**: Track user verification status

```sql
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'phone', 'government_id', 'address', 'payment_method')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  verification_data JSONB, -- Encrypted sensitive data
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON public.user_verifications(user_id);
CREATE UNIQUE INDEX idx_verifications_user_type ON public.user_verifications(user_id, verification_type) WHERE status = 'verified';
```

**Benefits**:
- Enhanced trust and safety
- Verified badge system
- Reduced fraud
- Compliance with regulations

---

## Phase 2E: Analytics and Insights

### 8. **analytics_events** Table

**Purpose**: Track user behavior for insights

```sql
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'page_view', 'search', 'space_view', 'booking_started', 'booking_completed'
  event_data JSONB, -- Flexible event properties
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_analytics_events_type_date ON public.analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id, created_at);
CREATE INDEX idx_analytics_events_data ON public.analytics_events USING gin(event_data);
```

**Benefits**:
- Conversion funnel analysis
- User behavior insights
- A/B testing support
- Marketing attribution
- Product improvement data

---

### 9. **space_views** Table

**Purpose**: Detailed space view tracking

```sql
CREATE TABLE IF NOT EXISTS public.space_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  view_duration_seconds INTEGER,
  referrer_source TEXT, -- 'search', 'featured', 'category', 'direct', 'external'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_space_views_space_date ON public.space_views(space_id, created_at);
CREATE INDEX idx_space_views_user ON public.space_views(user_id);
```

**Benefits**:
- Popular spaces identification
- View-to-booking conversion rate
- User interest tracking
- Host analytics dashboard

---

## Phase 2F: Communication Enhancement

### 10. **email_templates** Table

**Purpose**: Manage transactional email templates

```sql
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  variables TEXT[], -- Available template variables
  category TEXT, -- 'booking', 'account', 'marketing', 'system'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.email_templates(id),
  recipient_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user ON public.email_logs(user_id, created_at);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
```

**Benefits**:
- Centralized email management
- A/B testing email content
- Delivery tracking
- Open and click analytics
- Template versioning

---

## Implementation Priority

### High Priority (Implement First)
1. **space_availability_blocks** - Critical for preventing double-booking
2. **promotions** - Revenue generation and user acquisition
3. **disputes** - Trust and safety essential

### Medium Priority (Implement Next)
4. **space_pricing_rules** - Revenue optimization
5. **saved_searches** - User retention
6. **user_verifications** - Trust building

### Low Priority (Future Enhancement)
7. **space_amenities** (normalized) - Nice to have, current array works
8. **analytics_events** - Can use external analytics initially
9. **email_templates** - Can use external email service initially
10. **space_views** - Can derive from analytics_events

---

## Migration Scripts Template

```sql
-- Example: 006_add_availability_blocks.sql

-- Create the table
CREATE TABLE IF NOT EXISTS public.space_availability_blocks (
  -- ... table definition
);

-- Create indexes
CREATE INDEX ...;

-- Enable RLS
ALTER TABLE public.space_availability_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Hosts can manage availability for their spaces" 
  ON public.space_availability_blocks 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.spaces 
      WHERE spaces.id = space_availability_blocks.space_id 
      AND spaces.host_id = auth.uid()
    )
  );

-- Create triggers if needed
CREATE TRIGGER ...;
```

---

## Testing Checklist

For each new table:
- [ ] Table created successfully
- [ ] Indexes created and used by queries
- [ ] RLS policies tested for all user roles
- [ ] Foreign key constraints working
- [ ] Triggers functioning correctly
- [ ] Sample data inserted and queried
- [ ] Performance tested with realistic data volume
- [ ] Backup and restore tested

---

## Rollback Strategy

Each migration should have a corresponding rollback script:

```sql
-- Example: 006_rollback_availability_blocks.sql

-- Drop triggers
DROP TRIGGER IF EXISTS ...;

-- Drop policies
DROP POLICY IF EXISTS ...;

-- Drop indexes
DROP INDEX IF EXISTS ...;

-- Drop table
DROP TABLE IF EXISTS public.space_availability_blocks;
```

---

## Conclusion

These enhancements will transform SpaceOnGo from a functional MVP to a feature-rich marketplace platform with:

- Advanced availability and pricing management
- Comprehensive marketing tools
- Robust trust and safety features
- Deep analytics and insights
- Professional communication systems

Implement in phases based on business priorities and user feedback.
