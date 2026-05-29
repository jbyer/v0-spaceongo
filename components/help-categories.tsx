"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, User, Building, CreditCard, Users, Shield, MapPin, Key } from "lucide-react"

const renterCategories = [
  {
    id: "renter-account",
    title: "Account Management",
    icon: User,
    description: "Account creation, profile updates, and security",
    faqs: [
      {
        question: "How do I create a SpaceOnGo account?",
        answer:
          "To create an account, click the 'Register' button in the top navigation, fill out the required information including your email, password, and basic profile details. You'll receive a verification email to activate your account.",
      },
      {
        question: "How do I verify my email, and identity to activate my account?",
        answer:
          "We send a verification email to your email address. Click the link in the verification email to verify your identity.",
      },
      {
        question: "Can I switch my account from Renter to Host (or vice versa)?",
        answer:
          "Yes—your account supports both roles. You can toggle between Host and Renter at anytime by selecting the appropriate option in your user your profile settings.",
      },
      {
        question: "How can I update my profile information?",
        answer:
          "Log into your account and go to your user dashboard.  Then click on the Profile left navigate link to access your profile settings. You can update your personal information, contact details, profile photo, and preferences. Click the Save button to save your changes.",
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
    icon: CreditCard,
    description: "Booking process, payments, and cancellations",
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
    icon: Key,
    description: "Check-in, communication, and issue resolution",
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
    icon: Shield,
    description: "Safety measures and reporting",
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
]

const ownerCategories = [
  {
    id: "listing",
    title: "Creating Your Listing",
    icon: Building,
    description: "Space requirements, pricing, and listing setup",
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
    icon: Users,
    description: "Booking requests, guest communication, and calendar management",
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
    icon: CreditCard,
    description: "Earnings, payouts, and pricing management",
    faqs: [
      {
        question: "How do I connect my bank account to receive payouts for my listed spaces?",
        answer:
          "In your user profile screen within your dashboard, scroll down to the 'Select Your Payment Method' box and enter your desired payment information and save.",
      },
      {
        question: "How and when do I get paid?",
        answer:
          "Payments are released 24 hours after the guest checks out. Funds are transferred to your designated payout method (bank account or PayPal) when you click the Payout button within your dashboard.",
      },
      {
        question: "What fees does SpaceOnGo charge?",
        answer:
          "SpaceOnGo charges a service fee of 15% per booking. The fee is deducted from your payout automatically.",
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
    icon: Shield,
    description: "Property protection, insurance, and guest screening",
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
]

export default function HelpCategories() {
  const [selectedRole, setSelectedRole] = useState<"renter" | "owner">("renter")
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)

  const activeCategories = selectedRole === "renter" ? renterCategories : ownerCategories

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <p className="text-lg text-gray-600 mb-6">Select your role to find relevant support topics</p>

        <div className="flex justify-center gap-4 mb-8">
          <Button
            size="lg"
            variant={selectedRole === "renter" ? "default" : "outline"}
            onClick={() => {
              setSelectedRole("renter")
              setOpenCategory(null)
              setOpenFAQ(null)
            }}
            className="min-w-[160px]"
          >
            <MapPin className="h-5 w-5 mr-2" />
            I'm Renting a Space
          </Button>
          <Button
            size="lg"
            variant={selectedRole === "owner" ? "default" : "outline"}
            onClick={() => {
              setSelectedRole("owner")
              setOpenCategory(null)
              setOpenFAQ(null)
            }}
            className="min-w-[160px]"
          >
            <Building className="h-5 w-5 mr-2" />
            I'm a Space Owner
          </Button>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm font-medium text-gray-700">
            {selectedRole === "renter"
              ? "📍 Find answers about searching, booking, and staying in spaces"
              : "🏢 Get help with listing your space, managing bookings, and earning income"}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {activeCategories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <Collapsible
              open={openCategory === category.id}
              onOpenChange={() => setOpenCategory(openCategory === category.id ? null : category.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <category.icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{category.faqs.length} FAQs</Badge>
                      {openCategory === category.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {category.faqs.map((faq, index) => (
                      <div key={index} className="border-l-2 border-gray-100 pl-4">
                        <Collapsible
                          open={openFAQ === `${category.id}-${index}`}
                          onOpenChange={() =>
                            setOpenFAQ(openFAQ === `${category.id}-${index}` ? null : `${category.id}-${index}`)
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center justify-between w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                              <h4 className="font-medium text-gray-900 pr-4">{faq.question}</h4>
                              {openFAQ === `${category.id}-${index}` ? (
                                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-3 pb-3">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      
    </div>
  )
}
