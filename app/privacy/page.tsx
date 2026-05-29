import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, Lock, Users, Database, Mail, Phone, MapPin, Calendar } from "lucide-react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "Privacy Policy - Data Protection & Security",
  description:
    "Read SpaceOnGo's privacy policy to understand how we collect, use, and protect your personal information. Learn about your data rights under GDPR and CCPA compliance.",
  keywords: ["privacy policy", "data protection", "gdpr", "ccpa", "user privacy", "data security"],
  path: "/privacy",
})

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <p className="text-lg text-gray-600 mb-6">
                Your privacy is important to us. This policy explains how we collect, use, and protect your information.
              </p>
              <div className="flex justify-center items-center gap-4">
                <Badge variant="outline" className="text-sm">
                  Last Updated: December 22, 2024
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Version 2.0
                </Badge>
              </div>
            </div>

            {/* Quick Navigation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <a href="#information-collection" className="text-blue-600 hover:underline">
                    Information We Collect
                  </a>
                  <a href="#how-we-use" className="text-blue-600 hover:underline">
                    How We Use Data
                  </a>
                  <a href="#data-sharing" className="text-blue-600 hover:underline">
                    Data Sharing
                  </a>
                  <a href="#data-security" className="text-blue-600 hover:underline">
                    Data Security
                  </a>
                  <a href="#your-rights" className="text-blue-600 hover:underline">
                    Your Rights
                  </a>
                  <a href="#cookies" className="text-blue-600 hover:underline">
                    Cookies & Tracking
                  </a>
                  <a href="#children" className="text-blue-600 hover:underline">
                    Children's Privacy
                  </a>
                  <a href="#contact" className="text-blue-600 hover:underline">
                    Contact Us
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              {/* Introduction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Introduction
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    SpaceOnGo ("we," "our," or "us") operates a space rental platform that connects space owners with
                    individuals and businesses seeking temporary space rentals. This Privacy Policy explains how we
                    collect, use, disclose, and safeguard your information when you use our platform, mobile
                    application, and related services.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    By using SpaceOnGo, you consent to the data practices described in this policy. If you do not agree
                    with this policy, please do not use our services.
                  </p>
                </CardContent>
              </Card>

              {/* Information We Collect */}
              <Card id="information-collection">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    Information We Collect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Personal Information
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
                        <li>
                          <strong>Account Information:</strong> Name, email address, phone number, profile photo
                        </li>
                        <li>
                          <strong>Identity Verification:</strong> Government-issued ID, driver's license, passport
                          information
                        </li>
                        <li>
                          <strong>Payment Information:</strong> Credit card details, bank account information, billing
                          address
                        </li>
                        <li>
                          <strong>Profile Data:</strong> Bio, preferences, reviews, ratings, and user-generated content
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Space and Location Data
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
                        <li>
                          <strong>Space Listings:</strong> Property addresses, descriptions, photos, videos, amenities
                        </li>
                        <li>
                          <strong>Location Services:</strong> GPS coordinates, IP address location, search locations
                        </li>
                        <li>
                          <strong>Booking Information:</strong> Reservation details, check-in/out times, guest
                          information
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Usage and Technical Data
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
                        <li>
                          <strong>Device Information:</strong> Device type, operating system, browser type, unique
                          device identifiers
                        </li>
                        <li>
                          <strong>Usage Analytics:</strong> Pages viewed, features used, time spent, click patterns
                        </li>
                        <li>
                          <strong>Communication Data:</strong> Messages between users, customer support interactions
                        </li>
                        <li>
                          <strong>Log Data:</strong> IP addresses, access times, error logs, security events
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How We Use Your Information */}
              <Card id="how-we-use">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-600" />
                    How We Use Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Operations</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Create and manage user accounts</li>
                        <li>Process bookings and payments</li>
                        <li>Facilitate communication between users</li>
                        <li>Provide customer support</li>
                        <li>Verify user identity and prevent fraud</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Improvement</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Analyze usage patterns and preferences</li>
                        <li>Develop new features and services</li>
                        <li>Personalize user experience</li>
                        <li>Conduct research and analytics</li>
                        <li>Optimize platform performance</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal and Safety</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Comply with legal obligations</li>
                        <li>Enforce terms of service</li>
                        <li>Investigate security incidents</li>
                        <li>Protect user safety and rights</li>
                        <li>Resolve disputes and claims</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Marketing and Communication</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Send booking confirmations and updates</li>
                        <li>Provide promotional offers (with consent)</li>
                        <li>Send platform updates and announcements</li>
                        <li>Conduct surveys and feedback requests</li>
                        <li>Deliver targeted advertising</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Sharing and Disclosure */}
              <Card id="data-sharing">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    Data Sharing and Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">We Never Sell Your Personal Data</h3>
                      <p className="text-blue-800">
                        SpaceOnGo does not sell, rent, or trade your personal information to third parties for their
                        marketing purposes.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">When We Share Information</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900">With Other Users</h4>
                          <p className="text-gray-700">
                            Profile information, reviews, and booking details are shared to facilitate transactions.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Service Providers</h4>
                          <p className="text-gray-700">
                            Payment processors, identity verification services, cloud hosting, and analytics providers.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Legal Requirements</h4>
                          <p className="text-gray-700">
                            When required by law, court order, or to protect our rights and safety.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Business Transfers</h4>
                          <p className="text-gray-700">
                            In connection with mergers, acquisitions, or sale of assets (with user notification).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Security */}
              <Card id="data-security">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Data Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Safeguards</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>SSL/TLS encryption for data transmission</li>
                        <li>AES-256 encryption for data at rest</li>
                        <li>Multi-factor authentication options</li>
                        <li>Regular security audits and penetration testing</li>
                        <li>Secure cloud infrastructure (AWS/Google Cloud)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Operational Security</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Employee background checks and training</li>
                        <li>Role-based access controls</li>
                        <li>24/7 security monitoring</li>
                        <li>Incident response procedures</li>
                        <li>Regular data backups and recovery testing</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      <strong>Important:</strong> While we implement industry-standard security measures, no system is
                      100% secure. We encourage users to use strong passwords and enable two-factor authentication.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Your Rights and Choices */}
              <Card id="your-rights">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Your Rights and Choices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Rights (GDPR/CCPA)</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>
                          <strong>Access:</strong> Request copies of your personal data
                        </li>
                        <li>
                          <strong>Rectification:</strong> Correct inaccurate information
                        </li>
                        <li>
                          <strong>Erasure:</strong> Request deletion of your data
                        </li>
                        <li>
                          <strong>Portability:</strong> Export your data in a readable format
                        </li>
                        <li>
                          <strong>Restriction:</strong> Limit how we process your data
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Controls</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Update profile and account information</li>
                        <li>Manage privacy and notification settings</li>
                        <li>Control data sharing preferences</li>
                        <li>Delete your account and associated data</li>
                        <li>Opt-out of marketing communications</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                      <strong>Exercise Your Rights:</strong> Contact us at{" "}
                      <a href="mailto:privacy@spaceongo.com" className="underline">
                        privacy@spaceongo.com
                      </a>{" "}
                      to exercise any of these rights. We will respond within 30 days.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cookies and Tracking */}
              <Card id="cookies">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-pink-600" />
                    Cookies and Tracking Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Types of Cookies We Use</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Essential Cookies</h4>
                          <p className="text-sm text-gray-700">
                            Required for platform functionality, security, and user authentication.
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Analytics Cookies</h4>
                          <p className="text-sm text-gray-700">
                            Help us understand how users interact with our platform to improve services.
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Preference Cookies</h4>
                          <p className="text-sm text-gray-700">
                            Remember your settings and preferences for a personalized experience.
                          </p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Marketing Cookies</h4>
                          <p className="text-sm text-gray-700">
                            Used to deliver relevant advertisements and measure campaign effectiveness.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Managing Cookies</h3>
                      <p className="text-gray-700 mb-3">You can control cookies through:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                        <li>Browser settings (most browsers allow you to refuse cookies)</li>
                        <li>Our cookie preference center (available in account settings)</li>
                        <li>Third-party opt-out tools for advertising cookies</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Children's Privacy */}
              <Card id="children">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-teal-600" />
                    Children's Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Age Restriction</h3>
                    <p className="text-red-800 mb-3">
                      SpaceOnGo is not intended for children under 18 years of age. We do not knowingly collect personal
                      information from children under 18.
                    </p>
                    <p className="text-red-800">
                      If we become aware that we have collected personal information from a child under 18, we will take
                      steps to delete such information immediately. Parents who believe their child has provided
                      information to us should contact us at{" "}
                      <a href="mailto:privacy@spaceongo.com" className="underline">
                        privacy@spaceongo.com
                      </a>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* International Data Transfers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cyan-600" />
                    International Data Transfers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    SpaceOnGo operates globally and may transfer your personal information to countries other than your
                    own. We ensure appropriate safeguards are in place:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                    <li>Standard Contractual Clauses approved by the European Commission</li>
                    <li>Adequacy decisions for transfers to countries with adequate protection</li>
                    <li>Binding Corporate Rules for intra-group transfers</li>
                    <li>Your explicit consent for specific transfers</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data Retention */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    Data Retention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">
                      We retain your personal information only as long as necessary for the purposes outlined in this
                      policy:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Account Data</h4>
                        <p className="text-sm text-gray-700">
                          Retained while your account is active and for 3 years after account closure for legal
                          compliance.
                        </p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Transaction Records</h4>
                        <p className="text-sm text-gray-700">
                          Kept for 7 years for tax, accounting, and legal requirements.
                        </p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Marketing Data</h4>
                        <p className="text-sm text-gray-700">
                          Retained until you opt-out or for 2 years of inactivity.
                        </p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Support Communications</h4>
                        <p className="text-sm text-gray-700">
                          Kept for 3 years to improve customer service and resolve disputes.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Updates to This Policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-violet-600" />
                    Updates to This Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology,
                    legal requirements, or other factors.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How We Notify You</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                      <li>Email notification to registered users</li>
                      <li>Prominent notice on our platform</li>
                      <li>In-app notifications for significant changes</li>
                      <li>30-day notice period for material changes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card id="contact">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    Contact Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy Questions</h3>
                      <div className="space-y-2 text-gray-700">
                        <p>
                          <strong>Email:</strong>{" "}
                          <a href="mailto:privacy@spaceongo.com" className="text-blue-600 hover:underline">
                            privacy@spaceongo.com
                          </a>
                        </p>
                        <p>
                          <strong>Response Time:</strong> Within 48 hours
                        </p>
                        <p>
                          <strong>Data Protection Officer:</strong> Available for EU residents
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">For EU Residents</h3>
                      <div className="space-y-2 text-gray-700">
                        <p>
                          <strong>Complaints:</strong> You have the right to lodge a complaint with your local data
                          protection authority if you believe we have not addressed your privacy concerns adequately.
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
