"use client"

import { Star, Users, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getSpaceUrl } from "@/lib/utils/slug"

interface ReviewsSummaryProps {
  spaceId: string
  spaceTitle: string
  averageRating: number
  totalReviews: number
  recentReviews?: Array<{
    id: string
    userName: string
    rating: number
    comment: string
    date: string
  }>
}

export function SpaceReviewsSummary({
  spaceId,
  spaceTitle,
  averageRating = 4.8,
  totalReviews = 127,
  recentReviews = [
    {
      id: "1",
      userName: "Sarah J.",
      rating: 5,
      comment: "Perfect space for our team event! Highly recommend.",
      date: "2024-01-15",
    },
    {
      id: "2",
      userName: "Michael C.",
      rating: 4,
      comment: "Great location and very clean. Would book again.",
      date: "2024-01-10",
    },
  ],
}: ReviewsSummaryProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Rating Overview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">{averageRating}</div>
              <div>
                {renderStars(Math.round(averageRating))}
                <div className="text-sm text-gray-600 mt-1">{totalReviews} reviews</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{totalReviews} guests</span>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Recent Reviews
            </h4>
            {recentReviews.slice(0, 2).map((review) => (
              <div key={review.id} className="border-l-2 border-orange-200 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{review.userName}</span>
                  {renderStars(review.rating)}
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
              </div>
            ))}
          </div>

          {/* View All Reviews Button */}
          <Link href={`${getSpaceUrl(spaceTitle, spaceId)}#reviews`}>
            <Button variant="outline" className="w-full bg-transparent">
              View All {totalReviews} Reviews
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
