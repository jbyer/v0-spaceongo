// Google Analytics utility functions for tracking custom events

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Check if GA is enabled
export const isGAEnabled = (): boolean => {
  return !!GA_TRACKING_ID && typeof window !== "undefined" && !!window.gtag
}

// Track page views
export const pageview = (url: string): void => {
  if (!isGAEnabled()) return

  window.gtag("config", GA_TRACKING_ID!, {
    page_path: url,
  })
}

// Track custom events
interface EventParams {
  action: string
  category: string
  label?: string
  value?: number
}

export const event = ({ action, category, label, value }: EventParams): void => {
  if (!isGAEnabled()) return

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Predefined event trackers for common actions
export const trackSpaceView = (spaceId: string, spaceName: string): void => {
  event({
    action: "view_space",
    category: "Engagement",
    label: `${spaceName} (${spaceId})`,
  })
}

export const trackBookingInitiated = (spaceId: string, spaceName: string): void => {
  event({
    action: "initiate_booking",
    category: "Conversion",
    label: `${spaceName} (${spaceId})`,
  })
}

export const trackBookingCompleted = (spaceId: string, value: number): void => {
  event({
    action: "complete_booking",
    category: "Conversion",
    label: spaceId,
    value: value,
  })
}

export const trackSearch = (searchTerm: string): void => {
  event({
    action: "search",
    category: "Engagement",
    label: searchTerm,
  })
}

export const trackSignUp = (method: string): void => {
  event({
    action: "sign_up",
    category: "User",
    label: method,
  })
}

export const trackLogin = (method: string): void => {
  event({
    action: "login",
    category: "User",
    label: method,
  })
}

export const trackSpaceListing = (spaceId: string): void => {
  event({
    action: "list_space",
    category: "User",
    label: spaceId,
  })
}

export const trackMessageSent = (): void => {
  event({
    action: "send_message",
    category: "Engagement",
  })
}

export const trackFavoriteAdded = (spaceId: string): void => {
  event({
    action: "add_favorite",
    category: "Engagement",
    label: spaceId,
  })
}

export const trackShareSpace = (spaceId: string, method: string): void => {
  event({
    action: "share",
    category: "Engagement",
    label: `${method} - ${spaceId}`,
  })
}
