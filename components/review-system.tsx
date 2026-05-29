"use client"

import { useState } from "react"
import { Star, ThumbsUp, Flag, User, Shield, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  date: string
  verified: boolean
  helpful: number
  hostResponse?: {
    comment: string
    date: string
  }
  images?: string[]
}

interface ReviewSystemProps {
  spaceId: string
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

const mockReviews: Review[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Sarah Johnson",
    userAvatar: "/placeholder.svg?height=40&width=40&text=SJ",
    rating: 5,
    comment:
      "Absolutely perfect space for our team retreat! The host was incredibly responsive and the amenities exceeded our expectations. The natural lighting was amazing for our workshop sessions.",
    date: "2024-01-15",
    verified: true,
    helpful: 12,
    hostResponse: {
      comment: "Thank you so much Sarah! It was a pleasure hosting your team. Hope to see you again soon!",
      date: "2024-01-16",
    },
  },
  {
    id: "2",
    userId: "user2",
    userName: "Michael Chen",
    userAvatar: "/placeholder.svg?height=40&width=40&text=MC",
    rating: 4,
    comment:
      "Great location and very clean space. The booking process was smooth and the host provided clear instructions. Only minor issue was parking, but overall highly recommend!",
    date: "2024-01-10",
    verified: true,
    helpful: 8,
  },
  {
    id: "3",
    userId: "user3",
    userName: "Emily Rodriguez",
    userAvatar: "/placeholder.svg?height=40&width=40&text=ER",
    rating: 5,
    comment:
      "This space was exactly what we needed for our product launch event. Professional setup, great acoustics, and the host went above and beyond to ensure everything was perfect.",
    date: "2024-01-05",
    verified: true,
    helpful: 15,
  },
]

export function ReviewSystem({
  spaceId,
  reviews = mockReviews,
  averageRating = 4.8,
  totalReviews = 127,
}: ReviewSystemProps) {
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    )
  }

  const handleSubmitReview = () => {
    if (newRating > 0 && newComment.trim()) {
      // Handle review submission
      console.log("Submitting review:", { rating: newRating, comment: newComment })
      setShowWriteReview(false)
      setNewRating(0)
      setNewComment("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{averageRating}</div>
            {renderStars(averageRating)}
            <div className="text-sm text-gray-600 mt-1">{totalReviews} reviews</div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter((r) => r.rating === rating).length
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-gray-600 w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <Dialog open={showWriteReview} onOpenChange={setShowWriteReview}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">Write a Review</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                {renderStars(newRating, true, setNewRating)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  placeholder="Share your experience with this space..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">{newComment.length}/500 characters</div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  disabled={newRating === 0 || !newComment.trim()}
                  className="flex-1"
                >
                  Submit Review
                </Button>
                <Button variant="outline" onClick={() => setShowWriteReview(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Sort by:</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.userAvatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.userName}</span>
                      {review.verified && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-700 mb-3">{review.comment}</p>

              {review.hostResponse && (
                <div className="bg-gray-50 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-sm">Host Response</span>
                    <span className="text-xs text-gray-500">{review.hostResponse.date}</span>
                  </div>
                  <p className="text-sm text-gray-700">{review.hostResponse.comment}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpful})
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
