/**
 * Shared date/time formatting utilities.
 * All functions automatically detect and use the user's local timezone
 * via Intl.DateTimeFormat().resolvedOptions().timeZone, ensuring
 * consistent display across every dashboard component.
 */

function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** e.g. "Feb 10, 2026" */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: getUserTimeZone(),
  })
}

/** e.g. "February 10, 2026" */
export function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: getUserTimeZone(),
  })
}

/** e.g. "2:00 PM" */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: getUserTimeZone(),
  })
}

/** e.g. "Feb 10, 2026, 2:00 PM" */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: getUserTimeZone(),
  })
}

/** e.g. "2/10/2026" — compact format for tables */
export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    timeZone: getUserTimeZone(),
  })
}
