# Email Availability Check System

## Overview

Comprehensive email availability checking system for the SpaceOnGo registration process. Provides real-time validation to prevent duplicate accounts and improve user experience.

## Features

- **Real-time Checking**: Debounced API calls as users type
- **Visual Feedback**: Loading spinners, success/error icons
- **Error Handling**: Network errors, malformed emails, database issues
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Reusable Components**: Custom hook and UI component for easy integration
- **Performance**: Debouncing, request cancellation, caching prevention

## Implementation

### 1. Custom Hook: `useEmailAvailability`

Located in: `hooks/use-email-availability.ts`

**Automatic Mode** (checks as user types):
```tsx
import { useEmailAvailability } from "@/hooks/use-email-availability"

function MyForm() {
  const [email, setEmail] = useState("")
  
  const { exists, available, isChecking, error, message } = useEmailAvailability(email, {
    debounceMs: 500,
    validateFormat: true,
    onCheckComplete: (result) => {
      if (result.exists) {
        setFormError("Email already registered")
      }
    }
  })

  return (
    <div>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      {isChecking && <span>Checking...</span>}
      {available && <span>✓ Available</span>}
      {exists && <span>✗ Already taken</span>}
    </div>
  )
}
```

**Manual Mode** (checks on blur/submit):
```tsx
import { useEmailAvailabilityManual } from "@/hooks/use-email-availability"

function MyForm() {
  const { exists, checkEmail, isChecking, reset } = useEmailAvailabilityManual()

  const handleBlur = async () => {
    await checkEmail(email)
  }

  return (
    <input 
      type="email" 
      onBlur={handleBlur}
    />
  )
}
```

### 2. Reusable Component: `EmailInput`

Located in: `components/ui/email-input.tsx`

```tsx
import { EmailInput } from "@/components/ui/email-input"

function RegistrationForm() {
  const [email, setEmail] = useState("")

  return (
    <EmailInput
      label="Email Address"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onAvailabilityChange={(available) => {
        console.log("Email is available:", available)
      }}
      required
    />
  )
}
```

### 3. API Endpoint: `/api/auth/check-email`

Located in: `app/api/auth/check-email/route.ts`

**Request:**
```bash
POST /api/auth/check-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "exists": false,
  "available": true,
  "message": "Email is available"
}
```

**Error Response:**
```json
{
  "error": "Invalid email format",
  "exists": false,
  "available": false,
  "message": "Please enter a valid email address"
}
```

## Validation Rules

### Email Format
- Must match regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Must be 5-254 characters long
- Automatically trimmed and lowercased

### Edge Cases Handled
- Empty strings
- Whitespace-only inputs
- Malformed email addresses
- Network timeouts
- Database errors
- Concurrent requests (request cancellation)

## Integration Points

The email availability check is integrated in:

1. **Main Sign-Up Page** (`app/auth/sign-up/page.tsx`)
2. **Registration Popup** (`components/registration-popup.tsx`)
3. **Inline Registration Forms**:
   - All Spaces Grid (`components/all-spaces-grid.tsx`)
   - Search Results (`components/search-results.tsx`)
   - Space Detail Page (`app/space/[id]/SpaceDetailPageClient.tsx`)

## Performance Optimizations

1. **Debouncing**: 500ms default delay before API call
2. **Request Cancellation**: AbortController cancels pending requests
3. **Cache Prevention**: Response headers prevent email check caching
4. **Minimal Re-renders**: State updates only when necessary

## Accessibility

- ARIA labels for screen readers
- Error messages with proper role="alert"
- Keyboard navigation support
- Visual and text feedback for all states
- Color contrast meets WCAG AA standards

## Best Practices

1. Always check email availability before form submission
2. Use debouncing to reduce server load
3. Provide clear visual feedback (loading, success, error)
4. Handle network errors gracefully
5. Don't block form submission during check (show warning instead)
6. Use the reusable components/hooks for consistency

## Testing

To test the email availability check:

1. **Existing Email**: Try registering with an email that already exists
2. **Invalid Format**: Enter malformed email addresses
3. **Network Error**: Simulate offline mode
4. **Fast Typing**: Type quickly to test debouncing
5. **Multiple Requests**: Change email rapidly to test cancellation

## Future Enhancements

- [ ] Add email domain validation (disposable email detection)
- [ ] Implement rate limiting per IP
- [ ] Add analytics for registration funnel
- [ ] Cache results client-side (with TTL)
- [ ] Add suggested alternative emails if taken
