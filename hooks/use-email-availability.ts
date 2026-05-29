"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface EmailAvailabilityResult {
  exists: boolean
  available: boolean
  message: string
  isChecking: boolean
  error: string | null
}

export interface UseEmailAvailabilityOptions {
  debounceMs?: number
  validateFormat?: boolean
  onCheckComplete?: (result: { exists: boolean; available: boolean }) => void
}

/**
 * Custom hook to check email availability in Supabase database
 *
 * Features:
 * - Debounced API calls to reduce server load
 * - Email format validation
 * - Loading states and error handling
 * - Automatic cleanup on unmount
 * - Network error resilience
 *
 * @param email - Email address to check
 * @param options - Configuration options
 * @returns EmailAvailabilityResult with availability status and loading state
 *
 * @example
 * ```tsx
 * const { exists, available, isChecking, error } = useEmailAvailability(email, {
 *   debounceMs: 500,
 *   onCheckComplete: (result) => {
 *     if (result.exists) {
 *       setError("Email already taken")
 *     }
 *   }
 * })
 * ```
 */
export function useEmailAvailability(
  email: string,
  options: UseEmailAvailabilityOptions = {},
): EmailAvailabilityResult {
  const { debounceMs = 500, validateFormat = true, onCheckComplete } = options

  const [result, setResult] = useState<EmailAvailabilityResult>({
    exists: false,
    available: false,
    message: "",
    isChecking: false,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const checkEmailAvailability = useCallback(
    async (emailToCheck: string) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Reset state
      setResult((prev) => ({
        ...prev,
        isChecking: true,
        error: null,
      }))

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (validateFormat && !emailRegex.test(emailToCheck)) {
        setResult({
          exists: false,
          available: false,
          message: "Invalid email format",
          isChecking: false,
          error: "Invalid email format",
        })
        return
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToCheck.trim() }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to check email availability")
        }

        const data = await response.json()

        setResult({
          exists: data.exists,
          available: data.available,
          message: data.message,
          isChecking: false,
          error: null,
        })

        // Call completion callback if provided
        if (onCheckComplete) {
          onCheckComplete({ exists: data.exists, available: data.available })
        }
      } catch (error) {
        // Ignore abort errors (user is still typing)
        if (error instanceof Error && error.name === "AbortError") {
          return
        }

        console.error("[v0] Email availability check failed:", error)

        setResult({
          exists: false,
          available: false,
          message: "Failed to check email availability",
          isChecking: false,
          error: error instanceof Error ? error.message : "Network error occurred",
        })
      }
    },
    [validateFormat, onCheckComplete],
  )

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Don't check empty emails
    if (!email || !email.trim()) {
      setResult({
        exists: false,
        available: false,
        message: "",
        isChecking: false,
        error: null,
      })
      return
    }

    // Debounce the check
    debounceTimerRef.current = setTimeout(() => {
      checkEmailAvailability(email.trim())
    }, debounceMs)

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [email, debounceMs, checkEmailAvailability])

  return result
}

/**
 * Simplified version that only checks on blur/manual trigger
 */
export function useEmailAvailabilityManual() {
  const [result, setResult] = useState<EmailAvailabilityResult>({
    exists: false,
    available: false,
    message: "",
    isChecking: false,
    error: null,
  })

  const checkEmail = useCallback(async (email: string) => {
    if (!email || !email.trim()) {
      return
    }

    setResult((prev) => ({ ...prev, isChecking: true, error: null }))

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          exists: data.exists,
          available: data.available,
          message: data.message,
          isChecking: false,
          error: null,
        })
        return data
      } else {
        throw new Error(data.error || "Failed to check email")
      }
    } catch (error) {
      console.error("[v0] Email check failed:", error)
      setResult({
        exists: false,
        available: false,
        message: "Failed to check email availability",
        isChecking: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setResult({
      exists: false,
      available: false,
      message: "",
      isChecking: false,
      error: null,
    })
  }, [])

  return { ...result, checkEmail, reset }
}
