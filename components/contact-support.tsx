"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Mail, Clock, ThumbsUp, ThumbsDown, Send, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function ContactSupport() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [positiveFeedbackSubmitted, setPositiveFeedbackSubmitted] = useState(false)
  const { toast } = useToast()

  const handlePositiveFeedback = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "positive",
          page: "help",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to record feedback")
      }

      setPositiveFeedbackSubmitted(true)
      toast({
        title: "Thank you!",
        description: "We're glad you found this helpful. Your feedback helps us improve.",
      })
    } catch (error) {
      console.error("[v0] Positive feedback error:", error)
      toast({
        title: "Failed to record feedback",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      })
      return
    }

    if (feedbackMessage.length > 500) {
      toast({
        title: "Message too long",
        description: "Please keep your feedback under 500 characters.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "negative",
          message: feedbackMessage,
          page: "help",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send feedback")
      }

      toast({
        title: "Feedback sent!",
        description: "Thank you for helping us improve. Your message has been delivered to the admin.",
      })

      setFeedbackMessage("")
      setFeedbackOpen(false)
    } catch (error) {
      console.error("[v0] Feedback submission error:", error)
      toast({
        title: "Failed to send feedback",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Still need help?</h2>
        <p className="text-lg text-gray-600">Our support team is here to assist you</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Live Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Get instant help from our support team</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4" />
              <span>Available 24/7</span>
            </div>
            <Button className="w-full">Start Chat</Button>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle>Email Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Send us a detailed message</p>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div>
                General:{" "}
                <a href="mailto:support@spaceongo.com" className="text-green-600 hover:underline">
                  support@spaceongo.com
                </a>
              </div>
            </div>
            <Button className="w-full">Send Email</Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Help us improve</h3>
        {positiveFeedbackSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              <p className="font-medium">Thank you for your feedback!</p>
            </div>
            <p className="text-sm text-green-600 mt-1">We're glad you found this helpful.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Was this page helpful? Let us know how we can make our help center better.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={handlePositiveFeedback}
                disabled={isSubmitting}
              >
                <ThumbsUp className="h-4 w-4" />
                {isSubmitting ? "Recording..." : "Yes, helpful"}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
                onClick={() => setFeedbackOpen(true)}
                disabled={isSubmitting}
              >
                <ThumbsDown className="h-4 w-4" />
                Needs improvement
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Help Us Improve</DialogTitle>
            <DialogDescription>
              Tell us what we can do better. Your feedback will be sent to our admin team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Your feedback</Label>
              <Textarea
                id="feedback-message"
                placeholder="Let us know what needs improvement..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">{feedbackMessage.length} / 500 characters</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setFeedbackOpen(false)
                setFeedbackMessage("")
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              disabled={isSubmitting || !feedbackMessage.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
