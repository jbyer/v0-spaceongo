import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scale, FileText, Shield, Users, CreditCard, AlertTriangle, Phone, Mail } from "lucide-react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "Terms of Service - User Agreement",
  description:
    "Read SpaceOnGo's terms of service governing the use of our platform. Understand the rights and responsibilities for hosts and guests using our workspace rental marketplace.",
  keywords: ["terms of service", "user agreement", "terms and conditions", "legal terms", "platform rules"],
  path: "/terms",
})

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
              <p className="text-lg text-gray-600 mb-6">
                These terms govern your use of SpaceOnGo and outline the rights and responsibilities of all users.
              </p>
              <div className="flex justify-center items-center gap-4">
                <Badge variant="outline" className="text-sm">
                  Effective Date: December 22, 2024
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Version 3.0
                </Badge>
              </div>
            </div>

            {/* Important Notice */}
            <Alert className="mb-8">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> By using SpaceOnGo, you agree to be bound by these Terms of Service. Please
                read them carefully before using our platform.
              </AlertDescription>
            </Alert>

            {/* Quick Navigation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <a href="#acceptance" className="text-blue-600 hover:underline">
                    Acceptance of Terms
                  </a>
                  <a href="#platform-description" className="text-blue-600 hover:underline">
                    Platform Description
                  </a>
                  <a href="#user-accounts" className="text-blue-600 hover:underline">
                    User Accounts
                  </a>
                  <a href="#space-listings" className="text-blue-600 hover:underline">
                    Space Listings
                  </a>
                  <a href="#bookings" className="text-blue-600 hover:underline">
                    Bookings & Payments
                  </a>
                  <a href="#user-conduct" className="text-blue-600 hover:underline">
                    User Conduct
                  </a>
                  <a href="#liability" className="text-blue-600 hover:underline">
                    Liability
                  </a>
                  <a href="#termination" className="text-blue-600 hover:underline">
                    Termination
                  </a>
                  <a href="#intellectual-property" className="text-blue-600 hover:underline">
                    Intellectual Property Rights
                  </a>
                  <a href="#dispute-resolution" className="text-blue-600 hover:underline">
                    Dispute Resolution
                  </a>
                  <a href="#changes-to-terms" className="text-blue-600 hover:underline">
                    Changes to These Terms
                  </a>
                  <a href="#contact-information" className="text-blue-600 hover:underline">
                    Contact Information
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              {/* Acceptance of Terms */}
              <Card id="acceptance">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-blue-600" />
                    Acceptance of Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you,"
                    or "your") and SpaceOnGo, Inc. ("SpaceOnGo," "we," "us," or "our") regarding your use of the
                    SpaceOnGo platform, website, mobile application, and related services (collectively, the
                    "Platform").
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    By accessing, browsing, or using our Platform, you acknowledge that you have read, understood, and
                    agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you
                    must not use our Platform.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Age Requirement:</strong> You must be at least 18 years old to use SpaceOnGo. By using our
                      Platform, you represent and warrant that you are at least 18 years of age.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Description */}
              <Card id="platform-description">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Platform Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      SpaceOnGo operates an online marketplace that connects space owners ("Hosts") with individuals and
                      businesses seeking temporary space rentals ("Guests"). Our Platform facilitates:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Space discovery and booking services</li>
                      <li>Secure payment processing and financial transactions</li>
                      <li>Communication tools between Hosts and Guests</li>
                      <li>Review and rating systems</li>
                      <li>Identity verification and trust & safety measures</li>
                      <li>Customer support and dispute resolution</li>
                    </ul>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        <strong>Important:</strong> SpaceOnGo is a platform that facilitates connections between users.
                        We are not a party to the rental agreements between Hosts and Guests, nor do we own, operate, or
                        control any spaces listed on our Platform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Accounts */}
              <Card id="user-accounts">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    User Accounts and Registration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Creation</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>You must provide accurate, current, and complete information during registration</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                        <li>You must notify us immediately of any unauthorized use of your account</li>
                        <li>One person or entity may maintain only one SpaceOnGo account</li>
                        <li>You may not transfer your account to another party without our written consent</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Identity Verification</h3>
                      <p className="text-gray-700 mb-3">
                        To ensure platform safety and comply with legal requirements, we may require identity
                        verification, including:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Government-issued photo identification</li>
                        <li>Phone number verification</li>
                        <li>Email address confirmation</li>
                        <li>Background checks (where legally permitted)</li>
                        <li>Additional documentation as deemed necessary</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Space Listings */}
              <Card id="space-listings">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Space Listings and Host Responsibilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Listing Requirements</h3>
                      <p className="text-gray-700 mb-3">As a Host, you must ensure that your space listings:</p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Contain accurate and truthful descriptions of the space</li>
                        <li>Include current, high-quality photos that represent the actual space</li>
                        <li>Specify all applicable fees, taxes, and charges</li>
                        <li>Clearly state availability, house rules, and cancellation policies</li>
                        <li>Comply with all local laws, regulations, and zoning requirements</li>
                        <li>Meet all safety and accessibility standards</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Host Obligations</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Maintain your space in safe, clean, and habitable condition</li>
                        <li>Provide accurate availability and respond promptly to booking requests</li>
                        <li>Honor confirmed bookings and provide agreed-upon amenities</li>
                        <li>Comply with anti-discrimination laws and SpaceOnGo's non-discrimination policy</li>
                        <li>Obtain necessary permits, licenses, and insurance coverage</li>
                        <li>Pay applicable taxes on rental income</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Prohibited Listings</h4>
                      <p className="text-red-800 text-sm">
                        Spaces used for illegal activities, unsafe conditions, discriminatory practices, or violations
                        of local laws are strictly prohibited and will result in immediate account suspension.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bookings and Payments */}
              <Card id="bookings">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    Bookings, Payments, and Cancellations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Process</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Bookings are confirmed when payment is successfully processed</li>
                        <li>Guests must provide accurate booking information and intended use</li>
                        <li>Hosts may accept or decline booking requests within 24 hours</li>
                        <li>Confirmed bookings create a binding agreement between Host and Guest</li>
                        <li>SpaceOnGo facilitates but is not a party to the rental agreement</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Terms</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Guest Payments</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                            <li>Payment due at time of booking confirmation</li>
                            <li>Service fees and taxes included in total cost</li>
                            <li>Security deposits may be required</li>
                            <li>Additional charges for damages or violations</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Host Payouts</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-4">
                            <li>Payouts processed 24 hours after check-in</li>
                            <li>SpaceOnGo service fees (15%) are deducted from the gross booking value</li>
                            <li>Payouts subject to tax reporting requirements</li>
                            <li>Withheld amounts for damages or disputes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Policies</h3>
                      <p className="text-gray-700 mb-3">
                        Cancellation terms are set by individual Hosts and clearly displayed in each listing. Standard
                        policies include:
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-1">Flexible</h4>
                          <p className="text-sm text-gray-700">Full refund 24 hours before check-in</p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-1">Moderate</h4>
                          <p className="text-sm text-gray-700">Full refund 5 days before check-in</p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-1">Strict</h4>
                          <p className="text-sm text-gray-700">50% refund up to 1 week before check-in</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Conduct */}
              <Card id="user-conduct">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-600" />
                    User Conduct and Prohibited Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Acceptable Use</h3>
                      <p className="text-gray-700 mb-3">All users must:</p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Treat all users with respect and courtesy</li>
                        <li>Provide honest and accurate information</li>
                        <li>Respect others' property and privacy</li>
                        <li>Follow all applicable laws and regulations</li>
                        <li>Use the Platform only for its intended purposes</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Prohibited Activities</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 mb-3 font-medium">
                          The following activities are strictly prohibited:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <ul className="list-disc list-inside space-y-1 text-red-800 text-sm ml-4">
                            <li>Illegal activities or violations of local laws</li>
                            <li>Discrimination based on protected characteristics</li>
                            <li>Harassment, threats, or abusive behavior</li>
                            <li>Fraudulent or deceptive practices</li>
                            <li>Unauthorized commercial activities</li>
                            <li>Spam or unsolicited communications</li>
                          </ul>
                          <ul className="list-disc list-inside space-y-1 text-red-800 text-sm ml-4">
                            <li>Circumventing platform fees or policies</li>
                            <li>Creating fake accounts or reviews</li>
                            <li>Violating intellectual property rights</li>
                            <li>Compromising platform security</li>
                            <li>Subletting without Host permission</li>
                            <li>Exceeding occupancy limits</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liability and Disclaimers */}
              <Card id="liability">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Liability, Disclaimers, and Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-3">Platform Disclaimer</h3>
                      <p className="text-yellow-800 text-sm">
                        SpaceOnGo provides a platform for connecting users but does not own, operate, or control any
                        spaces. We are not responsible for the condition, safety, legality, or quality of spaces, nor
                        the accuracy of listings or user conduct.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
                      <p className="text-gray-700 mb-3">
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPACEONGO'S LIABILITY IS LIMITED AS FOLLOWS:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          Total liability shall not exceed the amount paid by you to SpaceOnGo in the 12 months
                          preceding the claim
                        </li>
                        <li>We are not liable for indirect, incidental, special, consequential, or punitive damages</li>
                        <li>We disclaim liability for user conduct, property damage, personal injury, or loss</li>
                        <li>Platform availability is provided "as is" without warranties of any kind</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">User Responsibilities</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Hosts are responsible for space safety, legality, and compliance with local laws</li>
                        <li>Guests are responsible for their conduct and any damages caused</li>
                        <li>Users must maintain appropriate insurance coverage</li>
                        <li>
                          Users agree to indemnify SpaceOnGo against claims arising from their use of the Platform
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Termination */}
              <Card id="termination">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-teal-600" />
                    Account Termination and Suspension
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Termination by User</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>You may terminate your account at any time through account settings</li>
                        <li>Outstanding bookings and financial obligations remain in effect</li>
                        <li>Some information may be retained for legal and safety purposes</li>
                        <li>Termination does not relieve you of obligations under these Terms</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Termination by SpaceOnGo</h3>
                      <p className="text-gray-700 mb-3">We may suspend or terminate your account for:</p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Violation of these Terms or our policies</li>
                        <li>Fraudulent, illegal, or harmful activities</li>
                        <li>Failure to pay fees or charges</li>
                        <li>Compromising platform safety or security</li>
                        <li>Repeated policy violations or poor user ratings</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Appeal Process</h4>
                      <p className="text-blue-800 text-sm">
                        If your account is suspended or terminated, you may appeal the decision by contacting our
                        support team within 30 days. We will review appeals in good faith and provide a response within
                        14 business days.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Intellectual Property */}
              <Card id="intellectual-property">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-600" />
                    Intellectual Property Rights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">SpaceOnGo Content</h3>
                      <p className="text-gray-700 mb-3">
                        The Platform, including its design, features, text, graphics, logos, and software, is owned by
                        SpaceOnGo and protected by intellectual property laws. You may not copy, modify, distribute, or
                        create derivative works without our written permission.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">User Content</h3>
                      <p className="text-gray-700 mb-3">
                        By posting content on our Platform, you grant SpaceOnGo a worldwide, royalty-free license to
                        use, display, and distribute your content for platform operations, marketing, and improvement
                        purposes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dispute Resolution */}
              <Card id="dispute-resolution">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-amber-600" />
                    Dispute Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Resolution Process</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                        <li>Contact our customer support team to attempt informal resolution</li>
                        <li>If unresolved, disputes may be submitted to binding arbitration</li>
                        <li>Arbitration conducted under American Arbitration Association rules</li>
                        <li>Class action lawsuits are waived in favor of individual arbitration</li>
                      </ol>
                    </div>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <p className="text-gray-700 text-sm">
                        <strong>Governing Law:</strong> These Terms are governed by the laws of the State of California,
                        without regard to conflict of law principles.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Changes to Terms */}
              <Card id="changes-to-terms">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-violet-600" />
                    Changes to These Terms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    We may update these Terms from time to time to reflect changes in our services, legal requirements,
                    or business practices. Material changes will be communicated through:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Email notification to registered users</li>
                    <li>Prominent notice on our Platform</li>
                    <li>In-app notifications for significant changes</li>
                    <li>30-day notice period before changes take effect</li>
                  </ul>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 text-sm">
                      Continued use of the Platform after changes take effect constitutes acceptance of the updated
                      Terms.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card id="contact-information">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Questions</h3>
                      <div className="space-y-2 text-gray-700">
                        <p>
                          <strong>Email:</strong>{" "}
                          <a href="mailto:legal@spaceongo.com" className="text-blue-600 hover:underline">
                            legal@spaceongo.com
                          </a>
                        </p>
                        <p>
                          <strong>Response Time:</strong> Within 5 business days
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
