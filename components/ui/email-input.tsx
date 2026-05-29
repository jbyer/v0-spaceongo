"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEmailAvailability } from "@/hooks/use-email-availability"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { forwardRef } from "react"

interface EmailInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  showValidation?: boolean
  onAvailabilityChange?: (available: boolean) => void
  error?: string
}

/**
 * Reusable email input component with built-in availability checking
 *
 * Features:
 * - Real-time email availability checking
 * - Visual feedback (loading spinner, success/error icons)
 * - Debounced API calls
 * - Accessible with proper ARIA labels
 * - Responsive design
 *
 * @example
 * ```tsx
 * <EmailInput
 *   label="Email Address"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   onAvailabilityChange={(available) => {
 *     if (!available) {
 *       setError("Email is already taken")
 *     }
 *   }}
 * />
 * ```
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ label = "Email", showValidation = true, onAvailabilityChange, error, className, ...props }, ref) => {
    const { exists, available, isChecking, message } = useEmailAvailability(props.value as string, {
      debounceMs: 500,
      onCheckComplete: (result) => {
        if (onAvailabilityChange) {
          onAvailabilityChange(result.available)
        }
      },
    })

    const showError = error || (exists && message)
    const showSuccess = !error && available && message && !isChecking

    return (
      <div className="grid gap-2">
        {label && (
          <Label htmlFor={props.id || "email"} className="text-sm font-medium">
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type="email"
            id={props.id || "email"}
            placeholder={props.placeholder || "m@example.com"}
            className={`${className || ""} ${showError ? "border-red-500 pr-10" : ""} ${showSuccess ? "border-green-500 pr-10" : ""}`}
            aria-invalid={!!showError}
            aria-describedby={showError ? `${props.id || "email"}-error` : undefined}
          />
          {showValidation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
              {!isChecking && showSuccess && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {!isChecking && showError && <AlertCircle className="h-4 w-4 text-red-600" />}
            </div>
          )}
        </div>
        {showValidation && (
          <>
            {showError && (
              <p
                id={`${props.id || "email"}-error`}
                className="text-xs text-red-600 flex items-center gap-1"
                role="alert"
              >
                <AlertCircle className="h-3 w-3" />
                {error || message}
              </p>
            )}
            {showSuccess && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {message}
              </p>
            )}
          </>
        )}
      </div>
    )
  },
)

EmailInput.displayName = "EmailInput"
