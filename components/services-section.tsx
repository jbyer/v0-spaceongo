import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Users, Clock, CreditCard, Headphones, TrendingUp } from "lucide-react"

export default function ServicesSection() {
  const forProviders = [
    {
      icon: Building,
      title: "List Your Space",
      description: "Easy-to-use tools to showcase your space with professional photos and detailed descriptions.",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Automated payment processing with guaranteed payouts and transparent fee structure.",
    },
    {
      icon: TrendingUp,
      title: "Growth & Analytics Tools",
      description:
        "Access detailed insights on bookings, revenue trends, and occupancy rates to optimize pricing and maximize your earning potential.",
    },
  ]

  const forRenters = [
    {
      icon: Users,
      title: "Diverse Options",
      description: "Access thousands of unique spaces from offices to event venues, all in one platform.",
    },
    {
      icon: Clock,
      title: "Flexible Booking",
      description: "Book by the hour, day, week, or month with instant confirmation and easy modifications.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock customer support to ensure your space rental experience is seamless.",
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Services That Deliver</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide comprehensive solutions for both space providers and renters, ensuring a smooth and secure
            experience for everyone.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* For Space Providers */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">For Space Providers</Badge>
            </div>
            <div className="space-y-6">
              {forProviders.map((service, index) => (
                <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <service.icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-gray-600">{service.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* For Space Renters */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">For Space Renters</Badge>
            </div>
            <div className="space-y-6">
              {forRenters.map((service, index) => (
                <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <service.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-gray-600">{service.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
