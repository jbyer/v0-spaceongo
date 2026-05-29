# Google Analytics Integration Guide

## Overview

SpaceOnGo uses Google Analytics 4 (GA4) to track user behavior, measure conversions, and optimize the platform experience. This implementation is privacy-compliant, respects user consent, and follows Next.js best practices.

## Setup Instructions

### 1. Create Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property
3. Copy your Measurement ID (format: `G-XXXXXXXXXX`)

### 2. Add Environment Variable

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For production, add this environment variable to your Vercel project:

```bash
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID
```

### 3. Deploy

The integration is already implemented and will activate automatically once the environment variable is set.

## Architecture

### Components

#### `GoogleAnalytics.tsx`
- Client component that loads GA scripts
- Respects user cookie consent
- Automatically tracks page views on navigation
- Uses Next.js `Script` component for optimal loading

#### `CookieConsentBanner.tsx`
- GDPR/CCPA compliant cookie consent banner
- Stores user preferences in localStorage
- Emits events when consent changes
- Three options: Accept All, Essential Only, Reject All

### Utilities

#### `lib/analytics.ts`
Provides helper functions for tracking custom events:

```typescript
import { trackSpaceView, trackBookingCompleted, trackSearch } from '@/lib/analytics'

// Track space view
trackSpaceView('space-123', 'Downtown Office')

// Track booking completion
trackBookingCompleted('space-123', 150.00)

// Track search
trackSearch('office space downtown')
```

## Privacy & Compliance

### Cookie Consent

The integration respects user privacy through:

1. **No tracking without consent** - GA scripts only load after user accepts cookies
2. **Consent options**:
   - **Accept All** - Enables analytics cookies
   - **Essential Only** - Only functional cookies, no tracking
   - **Reject All** - No cookies except essential
3. **Persistent storage** - User preferences saved in localStorage
4. **Event-driven** - Dynamic script loading based on consent changes

### GDPR Compliance

- Users can change cookie preferences anytime via `/cookies` page
- Clear information about cookie usage in Cookie Policy
- Analytics can be disabled entirely by rejecting cookies

## Custom Event Tracking

### Available Events

The following predefined events are available:

```typescript
// User actions
trackSignUp('email')           // Track user registration
trackLogin('google')           // Track user login
trackSpaceListing('space-id')  // Track space creation

// Engagement
trackSpaceView('space-id', 'Space Name')
trackSearch('query')
trackMessageSent()
trackFavoriteAdded('space-id')
trackShareSpace('space-id', 'facebook')

// Conversions
trackBookingInitiated('space-id', 'Space Name')
trackBookingCompleted('space-id', 150.00)
```

### Custom Events

Create custom events using the `event()` function:

```typescript
import { event } from '@/lib/analytics'

event({
  action: 'custom_action',
  category: 'Custom Category',
  label: 'Custom Label',
  value: 100
})
```

## Performance Optimization

### Script Loading Strategy

- Uses `strategy="afterInteractive"` for non-blocking script loading
- Scripts load after page becomes interactive
- No impact on initial page load performance

### Client-Side Navigation

- Automatically tracks page views during client-side navigation
- Uses Next.js `usePathname` and `useSearchParams` hooks
- Captures full URLs including query parameters

## Testing

### Verify Installation

1. **Check GA scripts load**:
   - Open DevTools > Network tab
   - Accept cookies in the banner
   - Verify requests to `googletagmanager.com`

2. **Test page tracking**:
   - Go to GA Real-Time reports
   - Navigate through your site
   - Verify page views appear in real-time

3. **Test custom events**:
   - Trigger actions (search, booking, etc.)
   - Check Events in GA Real-Time reports

### Debug Mode

Enable GA debug mode in your browser console:

```javascript
window.gtag('config', 'G-XXXXXXXXXX', {
  'debug_mode': true
});
```

## Integration Examples

### Track Space Booking Flow

```typescript
// In booking component
import { trackBookingInitiated, trackBookingCompleted } from '@/lib/analytics'

const handleBookingStart = () => {
  trackBookingInitiated(space.id, space.name)
  // ... booking logic
}

const handleBookingSuccess = (amount: number) => {
  trackBookingCompleted(space.id, amount)
  // ... success logic
}
```

### Track Search Results

```typescript
// In search component
import { trackSearch } from '@/lib/analytics'

const handleSearch = (query: string) => {
  trackSearch(query)
  // ... search logic
}
```

## Maintenance

### Updating GA Version

To update GA or change tracking IDs:

1. Update `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable
2. No code changes required
3. Redeploy application

### Adding New Events

1. Add function to `lib/analytics.ts`
2. Import and use in components
3. Events appear automatically in GA

## Troubleshooting

### Scripts Not Loading

- Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
- Check cookie consent is granted
- Verify no ad blockers are interfering

### Events Not Tracking

- Ensure consent is given
- Check GA Measurement ID is correct
- Verify events are called after consent
- Use GA debug mode to troubleshoot

### Privacy Concerns

- Users can opt-out via cookie banner
- Respect "Do Not Track" browser settings
- Review Cookie Policy page for transparency

## Best Practices

1. **Track meaningful events** - Focus on user actions that matter for business
2. **Use descriptive labels** - Make reports easy to understand
3. **Test before deploying** - Verify events in GA debug mode
4. **Respect privacy** - Always check consent before tracking
5. **Keep it simple** - Don't over-track, focus on key metrics

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Next.js Analytics Guide](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [GDPR Compliance Guide](https://support.google.com/analytics/answer/9019185)
