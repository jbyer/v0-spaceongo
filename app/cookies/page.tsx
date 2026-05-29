import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Cookie, Settings, Eye, Shield, BarChart3, Users, Info, Mail, Phone } from "lucide-react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { createMetadata } from "@/lib/seo/metadata"

export const metadata = createMetadata({
  title: "Cookie Policy - How We Use Cookies",
  description:
    "Learn about SpaceOnGo's cookie policy and how we use cookies to enhance your browsing experience. Manage your cookie preferences and understand your privacy choices.",
  keywords: ["cookie policy", "cookies", "tracking", "privacy preferences", "browser cookies", "analytics"],
  path: "/cookies",
})

export default function CookiePolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
              <p className="text-lg text-gray-600 mb-6">
                Learn how SpaceOnGo uses cookies and similar technologies to enhance your browsing experience and
                improve our services.
              </p>
              <div className="flex justify-center items-center gap-4">
                <Badge variant="outline" className="text-sm">
                  Last Updated: December 22, 2024
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Version 1.0
                </Badge>
              </div>
            </div>

            {/* Important Notice */}
            <Alert className="mb-8">
              <Cookie className="h-4 w-4" />
              <AlertDescription>
                <strong>Cookie Consent:</strong> By continuing to use SpaceOnGo, you consent to our use of cookies as
                described in this policy. You can manage your cookie preferences at any time through your browser
                settings or our cookie preference center.
              </AlertDescription>
            </Alert>

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
                  <a href="#what-are-cookies" className="text-blue-600 hover:underline">
                    What Are Cookies
                  </a>
                  <a href="#types-of-cookies" className="text-blue-600 hover:underline">
                    Types of Cookies
                  </a>
                  <a href="#how-we-use" className="text-blue-600 hover:underline">
                    How We Use Cookies
                  </a>
                  <a href="#third-party" className="text-blue-600 hover:underline">
                    Third-Party Cookies
                  </a>
                  <a href="#manage-cookies" className="text-blue-600 hover:underline">
                    Manage Cookies
                  </a>
                  <a href="#cookie-list" className="text-blue-600 hover:underline">
                    Cookie List
                  </a>
                  <a href="#updates" className="text-blue-600 hover:underline">
                    Policy Updates
                  </a>
                  <a href="#contact" className="text-blue-600 hover:underline">
                    Contact Us
                  </a>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              {/* What Are Cookies */}
              <Card id="what-are-cookies">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    What Are Cookies?
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when
                    you visit a website. They are widely used to make websites work more efficiently and provide
                    information to website owners about how users interact with their sites.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    SpaceOnGo uses cookies and similar technologies (such as web beacons, pixels, and local storage) to
                    enhance your user experience, analyze website performance, and deliver personalized content and
                    advertisements.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Key Benefits of Cookies</h3>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                      <li>Remember your login status and preferences</li>
                      <li>Provide personalized content and recommendations</li>
                      <li>Analyze website performance and user behavior</li>
                      <li>Enable essential website functionality</li>
                      <li>Improve security and prevent fraud</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Types of Cookies */}
              <Card id="types-of-cookies">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-green-600" />
                    Types of Cookies We Use
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Essential Cookies
                        </h3>
                        <p className="text-green-800 text-sm mb-3">
                          These cookies are necessary for the website to function properly and cannot be disabled.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
                          <li>User authentication and session management</li>
                          <li>Security and fraud prevention</li>
                          <li>Shopping cart and booking functionality</li>
                          <li>Load balancing and website performance</li>
                          <li>Cookie consent preferences</li>
                        </ul>
                      </div>

                      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Analytics Cookies
                        </h3>
                        <p className="text-blue-800 text-sm mb-3">
                          Help us understand how visitors interact with our website to improve user experience.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                          <li>Page views and user journey tracking</li>
                          <li>Performance monitoring and error reporting</li>
                          <li>A/B testing and feature optimization</li>
                          <li>Search behavior and popular content</li>
                          <li>Device and browser information</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Functionality Cookies
                        </h3>
                        <p className="text-purple-800 text-sm mb-3">
                          Remember your preferences and settings to provide a personalized experience.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-purple-800 text-sm">
                          <li>Language and region preferences</li>
                          <li>Search filters and sorting options</li>
                          <li>Recently viewed spaces</li>
                          <li>Accessibility settings</li>
                          <li>Theme and display preferences</li>
                        </ul>
                      </div>

                      <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <h3 className="text-lg font-semibold text-orange-900 mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Marketing Cookies
                        </h3>
                        <p className="text-orange-800 text-sm mb-3">
                          Used to deliver relevant advertisements and measure campaign effectiveness.
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-orange-800 text-sm">
                          <li>Targeted advertising and retargeting</li>
                          <li>Social media integration</li>
                          <li>Campaign performance tracking</li>
                          <li>Cross-device user identification</li>
                          <li>Interest-based content delivery</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How We Use Cookies */}
              <Card id="how-we-use">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    How We Use Cookies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Functionality</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          <li>
                            <strong>User Authentication:</strong> Keep you logged in during your session
                          </li>
                          <li>
                            <strong>Booking Process:</strong> Remember your booking details and preferences
                          </li>
                          <li>
                            <strong>Search Functionality:</strong> Save your search criteria and filters
                          </li>
                          <li>
                            <strong>Language Settings:</strong> Display content in your preferred language
                          </li>
                        </ul>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          <li>
                            <strong>Security:</strong> Protect against fraud and unauthorized access
                          </li>
                          <li>
                            <strong>Performance:</strong> Optimize page loading and reduce server load
                          </li>
                          <li>
                            <strong>Error Tracking:</strong> Identify and fix technical issues
                          </li>
                          <li>
                            <strong>Accessibility:</strong> Remember your accessibility preferences
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Analytics and Improvement</h3>
                      <p className="text-gray-700 mb-3">
                        We use analytics cookies to understand how users interact with our platform, which helps us:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Identify popular spaces and features</li>
                        <li>Understand user journey and pain points</li>
                        <li>Optimize search and booking processes</li>
                        <li>Improve mobile and desktop experiences</li>
                        <li>Develop new features based on user behavior</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Personalization</h3>
                      <p className="text-gray-700 mb-3">Cookies help us provide a personalized experience by:</p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>Showing relevant space recommendations</li>
                        <li>Customizing content based on your interests</li>
                        <li>Remembering your favorite spaces and searches</li>
                        <li>Providing location-based suggestions</li>
                        <li>Tailoring marketing messages to your preferences</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Third-Party Cookies */}
              <Card id="third-party">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-600" />
                    Third-Party Cookies and Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-gray-700">
                      SpaceOnGo works with trusted third-party services that may set their own cookies on your device.
                      These services help us provide better functionality and analyze our website performance.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Analytics Services</h3>
                        <div className="space-y-3">
                          <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-1">Google Analytics</h4>
                            <p className="text-sm text-gray-700 mb-2">Website traffic and user behavior analysis</p>
                            <a
                              href="https://policies.google.com/privacy"
                              className="text-blue-600 text-xs hover:underline"
                            >
                              Privacy Policy
                            </a>
                          </div>
                          <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-1">Hotjar</h4>
                            <p className="text-sm text-gray-700 mb-2">User experience and heatmap analysis</p>
                            <a
                              href="https://www.hotjar.com/legal/policies/privacy/"
                              className="text-blue-600 text-xs hover:underline"
                            >
                              Privacy Policy
                            </a>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Marketing & Social</h3>
                        <div className="space-y-3">
                          <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-1">Facebook Pixel</h4>
                            <p className="text-sm text-gray-700 mb-2">Social media advertising and retargeting</p>
                            <a
                              href="https://www.facebook.com/privacy/policy/"
                              className="text-blue-600 text-xs hover:underline"
                            >
                              Privacy Policy
                            </a>
                          </div>
                          <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-1">Google Ads</h4>
                            <p className="text-sm text-gray-700 mb-2">Search and display advertising campaigns</p>
                            <a
                              href="https://policies.google.com/privacy"
                              className="text-blue-600 text-xs hover:underline"
                            >
                              Privacy Policy
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">Third-Party Control</h4>
                      <p className="text-yellow-800 text-sm">
                        Please note that we do not control third-party cookies. These services have their own privacy
                        policies and cookie practices. We recommend reviewing their policies to understand how they
                        collect and use your information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Managing Cookies */}
              <Card id="manage-cookies">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-teal-600" />
                    Managing Your Cookie Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Cookie Preference Center</h3>
                      <p className="text-gray-700 mb-4">
                        You can manage your cookie preferences through our Cookie Preference Center, accessible from
                        your account settings or the cookie banner that appears on your first visit.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Open Cookie Preferences
                        </button>
                        <p className="text-blue-800 text-sm mt-2">
                          Customize which types of cookies you want to allow or block.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser Settings</h3>
                      <p className="text-gray-700 mb-4">
                        You can also control cookies through your browser settings. Here's how to manage cookies in
                        popular browsers:
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Chrome</h4>
                          <p className="text-sm text-gray-700 mb-2">
                            Settings → Privacy and Security → Cookies and other site data
                          </p>
                          <a
                            href="https://support.google.com/chrome/answer/95647"
                            target="_blank"
                            className="text-blue-600 text-xs hover:underline"
                            rel="noreferrer"
                          >
                            Learn More
                          </a>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Firefox</h4>
                          <p className="text-sm text-gray-700 mb-2">
                            Options → Privacy & Security → Cookies and Site Data
                          </p>
                          <a
                            href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                            target="_blank"
                            className="text-blue-600 text-xs hover:underline"
                            rel="noreferrer"
                          >
                            Learn More
                          </a>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Safari</h4>
                          <p className="text-sm text-gray-700 mb-2">Preferences → Privacy → Manage Website Data</p>
                          <a
                            href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                            target="_blank"
                            className="text-blue-600 text-xs hover:underline"
                            rel="noreferrer"
                          >
                            Learn More
                          </a>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Edge</h4>
                          <p className="text-sm text-gray-700 mb-2">
                            Settings → Cookies and site permissions → Cookies and site data
                          </p>
                          <a
                            href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                            target="_blank"
                            className="text-blue-600 text-xs hover:underline"
                            rel="noreferrer"
                          >
                            Learn More
                          </a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Opt-Out Tools</h3>
                      <p className="text-gray-700 mb-3">
                        For advertising cookies, you can use these industry opt-out tools:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li>
                          <a href="http://www.aboutads.info/choices/" className="text-blue-600 hover:underline">
                            Digital Advertising Alliance (DAA) Opt-Out
                          </a>
                        </li>
                        <li>
                          <a
                            href="http://www.networkadvertising.org/choices/"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                            rel="noreferrer"
                          >
                            Network Advertising Initiative (NAI) Opt-Out
                          </a>
                        </li>
                        <li>
                          <a
                            href="http://www.youronlinechoices.eu/"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                            rel="noreferrer"
                          >
                            European Interactive Digital Advertising Alliance (EDAA)
                          </a>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">Important Note</h4>
                      <p className="text-red-800 text-sm">
                        Disabling certain cookies may affect the functionality of SpaceOnGo. Essential cookies cannot be
                        disabled as they are necessary for the website to function properly. Some features may not work
                        correctly if you block functionality or analytics cookies.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cookie List */}
              <Card id="cookie-list">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-cyan-600" />
                    Detailed Cookie List
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-gray-700">
                      Below is a detailed list of cookies used on SpaceOnGo, organized by category:
                    </p>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Essential Cookies</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Cookie Name</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Purpose</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">spaceongo_session</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  User authentication and session management
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">Session</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">csrf_token</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  Security protection against cross-site request forgery
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">Session</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">cookie_consent</td>
                                <td className="px-4 py-2 text-sm text-gray-700">Remember your cookie preferences</td>
                                <td className="px-4 py-2 text-sm text-gray-700">1 year</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Analytics Cookies</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Cookie Name</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Purpose</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">_ga</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  Google Analytics - distinguish unique users
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">2 years</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">_ga_*</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  Google Analytics - session and campaign data
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">2 years</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">_hjid</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  Hotjar - user identification for heatmaps
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">1 year</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Functionality Cookies</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Cookie Name</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Purpose</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">user_preferences</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  Remember language, currency, and display settings
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">1 year</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">recent_searches</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  Store recent search queries and filters
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">30 days</td>
                              </tr>
                              <tr>
                                <td className="px-4 py-2 text-sm text-gray-900 font-mono">viewed_spaces</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  Track recently viewed spaces for recommendations
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">30 days</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Updates to Policy */}
              <Card id="updates">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-violet-600" />
                    Updates to This Cookie Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    We may update this Cookie Policy from time to time to reflect changes in our cookie practices, new
                    technologies, legal requirements, or improvements to our services.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How We Notify You of Changes</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                      <li>Updated "Last Modified" date at the top of this policy</li>
                      <li>Email notification for significant changes (if you have an account)</li>
                      <li>Cookie banner notification on your next visit</li>
                      <li>Prominent notice on our website for major updates</li>
                    </ul>
                  </div>
                  <p className="text-gray-700 mt-4">
                    We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies
                    and similar technologies.
                  </p>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card id="contact">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    Contact Us About Cookies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Cookie Questions</h3>
                      <div className="space-y-2 text-gray-700">
                        <p>
                          <strong>Email:</strong>{" "}
                          <a href="mailto:privacy@spaceongo.com" className="text-blue-600 hover:underline">
                            privacy@spaceongo.com
                          </a>
                        </p>
                        <p>
                          <strong>Subject Line:</strong> Cookie Policy Inquiry
                        </p>
                        <p>
                          <strong>Response Time:</strong> Within 48 hours
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Mailing Address</h3>
                      <div className="space-y-2 text-gray-700">
                        <p>
                          <strong>SpaceOnGo Privacy Team</strong>
                        </p>
                        <p>123 Main Street</p>
                        <p>Suite 400</p>
                        <p>San Francisco, CA 94102</p>
                        <p>United States</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm">
                      <strong>Need Help Managing Cookies?</strong> Our support team can help you understand and
                      configure your cookie preferences. We're committed to transparency and giving you control over
                      your data.
                    </p>
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
