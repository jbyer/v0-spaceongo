"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  spaceId: string
  spaceTitle: string
  hostId: string
  onSuccess: () => void
}

export function RatingModal({ isOpen, onClose, bookingId, spaceId, spaceTitle, hostId, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (comment.trim().length === 0) {
      setError("Please enter your feedback")
      return
    }

    if (comment.trim().length < 10) {
      setError("Please provide more detailed feedback (at least 10 characters)")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log("[v0] Submitting review...")
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to submit a review")
        setIsSubmitting(false)
        return
      }

      // Check if review already exists for this booking
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("reviewer_id", user.id)
        .single()

      if (existingReview) {
        setError("You have already reviewed this booking")
        setIsSubmitting(false)
        return
      }

      // Insert review
      const { error: insertError } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        space_id: spaceId,
        reviewer_id: user.id,
        reviewee_id: hostId,
        rating: rating,
        comment: comment.trim(),
        review_type: "space_review",
        is_public: true,
      })

      if (insertError) {
        console.error("[v0] Error inserting review:", insertError)
        setError("Failed to submit review. Please try again.")
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Review submitted successfully")

      // Reset form
      setRating(0)
      setComment("")

      // Call success callback and close modal
      onSuccess()
      onClose()
    } catch (error) {
      console.error("[v0] Error submitting review:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0)
      setComment("")
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>Share your feedback about {spaceTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isSubmitting}
                  className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Feedback</label>
            <Textarea
              placeholder="Tell us about your experience at this space..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              rows={5}
              className="resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 text-right">{comment.length}/1000 characters</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
