/**
 * Generates a URL-safe slug from a string
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated, URL-safe string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generates a space URL slug that combines title with ID for uniqueness
 * Format: "space-title-abc12345" (last 8 chars of UUID)
 * @param title - Space title
 * @param id - Space UUID
 * @returns A SEO-friendly, unique slug
 */
export function generateSpaceSlug(title: string, id: string): string {
  const titleSlug = generateSlug(title)
  const shortId = id.replace(/-/g, '').slice(-8) // Last 8 chars of UUID without dashes
  return `${titleSlug}-${shortId}`
}

/**
 * Extracts the space ID from a slug URL parameter
 * Handles both legacy UUID format and new slug format
 * @param slugOrId - The URL parameter (could be full UUID or slug with ID suffix)
 * @returns The space ID to use for database lookup, or null if invalid
 */
export function extractSpaceIdFromSlug(slugOrId: string): { type: 'uuid' | 'shortId', value: string } | null {
  // Check if it's a full UUID (legacy format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slugOrId)) {
    return { type: 'uuid', value: slugOrId }
  }
  
  // Extract short ID from end of slug (last 8 hex characters after final hyphen)
  const shortIdMatch = slugOrId.match(/-([0-9a-f]{8})$/i)
  if (shortIdMatch) {
    return { type: 'shortId', value: shortIdMatch[1] }
  }
  
  // If no valid pattern found, treat it as a potential UUID anyway (backwards compatibility)
  return { type: 'uuid', value: slugOrId }
}

/**
 * Generates the full URL path for a space
 * @param title - Space title
 * @param id - Space UUID
 * @returns Full URL path like "/space/cozy-downtown-office-abc12345"
 */
export function getSpaceUrl(title: string, id: string): string {
  return `/space/${generateSpaceSlug(title, id)}`
}
