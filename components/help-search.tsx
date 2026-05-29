"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, X, FileText, ChevronRight } from "lucide-react"

interface SearchResult {
  id: string
  type: "category" | "faq"
  categoryTitle: string
  categoryId: string
  question?: string
  answer?: string
  role: "renter" | "owner"
  matchScore: number
}

export default function HelpSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedPopularSearch, setSelectedPopularSearch] = useState("")

  const helpData = useMemo(
    () => [
      {
        role: "renter" as const,
        categories: [
          {
            id: "renter-account",
            title: "Account Management",
            faqs: [
              {
                question: "How do I create a SpaceOnGo account?",
                answer:
                  "To create an account, click the 'Register' button in the top navigation, fill out the required information including your email, password, and basic profile details. You'll receive a verification email to activate your account.",
              },
              {
                question: "How can I update my profile information?",
                answer:
                  "Log into your account and navigate to your profile settings. You can update your personal information, contact details, profile photo, and preferences. Changes are saved automatically.",
              },
              {
                question: "I forgot my password. How do I reset it?",
                answer:
                  "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
              },
            ],
          },
          {
            id: "booking",
            title: "Booking and Payments",
            faqs: [
              {
                question: "How do I book a space?",
                answer:
                  "Search for spaces using our filters, select your preferred space, choose your dates and duration, review the details and pricing, then complete the booking with payment. You'll receive instant confirmation.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept major credit cards (Visa, MasterCard, American Express), debit cards, PayPal, and digital wallets like Apple Pay and Google Pay. All payments are processed securely.",
              },
              {
                question: "What is your cancellation policy?",
                answer:
                  "Cancellation policies vary by listing. Most hosts offer flexible, moderate, or strict cancellation policies. Check the specific policy before booking. Refunds are processed according to the chosen policy and timing of cancellation.",
              },
              {
                question: "How do refunds work?",
                answer:
                  "Refunds are processed according to the cancellation policy and are typically returned to your original payment method within 5-10 business days. Service fees may be non-refundable depending on the timing of cancellation.",
              },
              {
                question: "Can I modify my booking after confirmation?",
                answer:
                  "Booking modifications depend on the host's policies and space availability. Contact the host directly through our messaging system to request changes. Additional fees may apply for modifications.",
              },
            ],
          },
          {
            id: "guest",
            title: "During Your Stay",
            faqs: [
              {
                question: "How do I communicate with my host?",
                answer:
                  "Use our secure messaging system accessible through your booking confirmation or account dashboard. This keeps all communication documented and ensures both parties have access to important information.",
              },
              {
                question: "What are the typical check-in procedures?",
                answer:
                  "Check-in procedures vary by space and host. Common methods include key pickup, lockbox codes, or meeting the host in person. All details will be provided in your booking confirmation and host communication.",
              },
              {
                question: "What should I do if there's an issue with my space?",
                answer:
                  "Contact your host immediately through our messaging system. If the issue isn't resolved quickly, contact our support team. We're available 24/7 to help resolve any problems during your stay.",
              },
              {
                question: "Can I leave a review after my stay?",
                answer:
                  "Yes, we encourage honest reviews. You can leave a review within 14 days after your checkout date. Reviews help other guests make informed decisions and help hosts improve their spaces.",
              },
              {
                question: "What if I need to extend my booking?",
                answer:
                  "Contact your host to check availability for extended dates. If available, you can extend through our platform with additional payment. Extensions are subject to the host's approval and availability.",
              },
            ],
          },
          {
            id: "renter-safety",
            title: "Safety and Security",
            faqs: [
              {
                question: "How does SpaceOnGo ensure my safety?",
                answer:
                  "We verify host identities, require accurate listings, provide secure payment processing, offer 24/7 support, and maintain insurance coverage. We also have community guidelines and a review system.",
              },
              {
                question: "What should I do if I feel unsafe?",
                answer:
                  "Your safety is our priority. If you feel unsafe, leave the space immediately and contact local emergency services if needed. Then contact our support team immediately at support@spaceongo.com or call our emergency line.",
              },
              {
                question: "Is my personal information secure?",
                answer:
                  "Yes, we use industry-standard encryption and security measures to protect your personal and payment information. We never share your details with hosts until after booking confirmation.",
              },
            ],
          },
        ],
      },
      {
        role: "owner" as const,
        categories: [
          {
            id: "listing",
            title: "Creating Your Listing",
            faqs: [
              {
                question: "What types of spaces can I list on SpaceOnGo?",
                answer:
                  "You can list various types of spaces including offices, co-working spaces, studios, conference rooms, event venues, storage facilities, and more. The space should be safe, legal to rent, and meet local regulations.",
              },
              {
                question: "What are the requirements for listing a space?",
                answer:
                  "Your space must be clean, safe, and legally available for rental. You'll need to provide accurate descriptions, high-quality photos, clear pricing, and availability calendar. All safety and legal requirements must be met.",
              },
              {
                question: "How do I set the right price for my space?",
                answer:
                  "Research similar spaces in your area, consider your space's unique features, location, and amenities. Use our pricing tool for suggestions based on market data. You can adjust prices based on demand and seasonality.",
              },
              {
                question: "Can I modify my listing after it's published?",
                answer:
                  "Yes, you can edit your listing anytime through your host dashboard. You can update photos, descriptions, pricing, availability, and house rules. Changes are reflected immediately on the platform.",
              },
              {
                question: "How long does it take for my listing to be approved?",
                answer:
                  "Most listings are reviewed and approved within 24-48 hours. We may contact you if additional information or photos are needed. You'll receive an email notification once your listing is live.",
              },
            ],
          },
          {
            id: "owner-management",
            title: "Managing Bookings",
            faqs: [
              {
                question: "How do I respond to booking requests?",
                answer:
                  "You'll receive instant notifications for new booking requests via email and in your host dashboard. Review the request details and respond within 24 hours to maintain your response rate. You can accept, decline, or send a message to the guest.",
              },
              {
                question: "Can I block dates when my space is unavailable?",
                answer:
                  "Yes, use your calendar management tool in the host dashboard to block dates when your space is unavailable. You can block single days or date ranges, and add notes for your reference.",
              },
              {
                question: "How do I handle guest check-in and check-out?",
                answer:
                  "Coordinate check-in details with your guest through our messaging system. Provide clear instructions for access (key pickup, lockbox codes, etc.). Document the space condition at check-in and check-out to protect against damage claims.",
              },
              {
                question: "What if a guest wants to cancel their booking?",
                answer:
                  "Guest cancellations are processed according to your cancellation policy. You'll be notified immediately and the calendar will be reopened for new bookings. Payouts are adjusted based on the policy and timing of the cancellation.",
              },
            ],
          },
          {
            id: "owner-payments",
            title: "Payments and Payouts",
            faqs: [
              {
                question: "How and when do I get paid?",
                answer:
                  "Payments are released 24 hours after the guest checks in. Funds are transferred to your designated payout method (bank account or PayPal) according to your payout schedule (daily, weekly, or monthly).",
              },
              {
                question: "What fees does SpaceOnGo charge?",
                answer:
                  "SpaceOnGo charges a service fee of 3-5% per booking (depending on your listing tier). This covers payment processing, customer support, and platform maintenance. The fee is deducted from your payout automatically.",
              },
              {
                question: "Can I offer discounts or special pricing?",
                answer:
                  "Yes, you can create custom pricing rules for weekends, extended stays, early bird bookings, or last-minute availability. You can also send special offers to specific guests or create promotional discounts.",
              },
              {
                question: "How do I track my earnings?",
                answer:
                  "Your host dashboard provides detailed earnings reports, including completed bookings, upcoming payouts, and historical data. You can export reports for tax purposes and track performance metrics.",
              },
            ],
          },
          {
            id: "owner-safety",
            title: "Safety and Protection",
            faqs: [
              {
                question: "What protection do I have against property damage?",
                answer:
                  "All bookings include host protection insurance covering up to $1 million in property damage. Document your space thoroughly and report any damage within 14 days of checkout to file a claim.",
              },
              {
                question: "How do I screen potential guests?",
                answer:
                  "Review guest profiles, verified ID, past reviews from other hosts, and their booking history. You can also communicate with guests before accepting to ensure they're a good fit for your space.",
              },
              {
                question: "What if a guest violates house rules?",
                answer:
                  "Document the violation with photos/videos and contact support immediately. You can end the reservation early for serious violations. Report the incident within 24 hours to ensure proper documentation for insurance claims.",
              },
              {
                question: "How do I report inappropriate behavior?",
                answer:
                  "Report any violations of our community standards through the 'Report' button in your messaging thread or contact our support team directly. We investigate all reports promptly and take appropriate action, including guest removal from the platform.",
              },
            ],
          },
        ],
      },
    ],
    [],
  )

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    helpData.forEach((roleData) => {
      roleData.categories.forEach((category) => {
        // Check if category title matches
        const categoryTitleMatch = category.title.toLowerCase().includes(query)

        if (categoryTitleMatch) {
          results.push({
            id: `${category.id}-category`,
            type: "category",
            categoryTitle: category.title,
            categoryId: category.id,
            role: roleData.role,
            matchScore: 10,
          })
        }

        // Check FAQs
        category.faqs.forEach((faq, index) => {
          const questionMatch = faq.question.toLowerCase().includes(query)
          const answerMatch = faq.answer.toLowerCase().includes(query)

          if (questionMatch || answerMatch || categoryTitleMatch) {
            results.push({
              id: `${category.id}-${index}`,
              type: "faq",
              categoryTitle: category.title,
              categoryId: category.id,
              question: faq.question,
              answer: faq.answer,
              role: roleData.role,
              matchScore: questionMatch ? 8 : answerMatch ? 5 : 3,
            })
          }
        })
      })
    })

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore)

    setSearchResults(results.slice(0, 8)) // Limit to top 8 results
    setShowResults(true)
  }, [searchQuery, helpData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled in real-time via useEffect
  }

  const handlePopularSearch = (search: string) => {
    setSearchQuery(search)
    setSelectedPopularSearch(search)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setShowResults(false)
    setSelectedPopularSearch("")
  }

  const scrollToCategory = (categoryId: string) => {
    setShowResults(false)
    setTimeout(() => {
      const element = document.getElementById(categoryId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 100)
  }

  return (
    <div className="max-w-2xl mx-auto mb-12">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
          <Input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            className="pl-12 pr-24 h-14 text-lg border-2 border-gray-200 focus:border-green-500"
            aria-label="Search help articles"
            aria-describedby="search-description"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <Button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10"
            aria-label="Submit search"
          >
            Search
          </Button>
        </div>

        {showResults && searchResults.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 shadow-xl z-50 max-h-[500px] overflow-y-auto">
            <CardContent className="p-0">
              <div className="p-3 bg-gray-50 border-b">
                <p className="text-sm font-medium text-gray-700">
                  Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      scrollToCategory(result.categoryId)
                      setSearchQuery("")
                    }}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={result.role === "renter" ? "default" : "secondary"} className="text-xs">
                            {result.role === "renter" ? "For Renters" : "For Owners"}
                          </Badge>
                          <span className="text-xs text-gray-500">{result.categoryTitle}</span>
                        </div>
                        {result.type === "faq" && (
                          <>
                            <p className="font-medium text-gray-900 text-sm mb-1">{result.question}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{result.answer}</p>
                          </>
                        )}
                        {result.type === "category" && (
                          <p className="font-medium text-gray-900 text-sm">View all {result.categoryTitle} questions</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showResults && searchQuery && searchResults.length === 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 shadow-xl z-50">
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-medium mb-2">No results found for "{searchQuery}"</p>
              <p className="text-sm text-gray-600 mb-4">Try different keywords or browse categories below</p>
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear search
              </Button>
            </CardContent>
          </Card>
        )}
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600" id="search-description">
          Popular searches:
          <span className="ml-2 space-x-2">
            <button
              onClick={() => handlePopularSearch("booking cancellation")}
              className={`text-green-600 hover:underline focus:outline-none focus:underline ${
                selectedPopularSearch === "booking cancellation" ? "font-semibold" : ""
              }`}
            >
              booking cancellation
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={() => handlePopularSearch("payment methods")}
              className={`text-green-600 hover:underline focus:outline-none focus:underline ${
                selectedPopularSearch === "payment methods" ? "font-semibold" : ""
              }`}
            >
              payment methods
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={() => handlePopularSearch("listing requirements")}
              className={`text-green-600 hover:underline focus:outline-none focus:underline ${
                selectedPopularSearch === "listing requirements" ? "font-semibold" : ""
              }`}
            >
              listing requirements
            </button>
          </span>
        </p>
      </div>
    </div>
  )
}
