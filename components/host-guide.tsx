import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, DollarSign, Shield, Clock } from "lucide-react"

export default function HostGuide() {
  const steps = [
    {
      icon: CheckCircle,
      title: "Create Your Listing",
      description: "Add photos, describe your space, and set your availability and pricing.",
    },
    {
      icon: DollarSign,
      title: "Start Earning",
      description: "Receive booking requests and start earning money from your unused space.",
    },
    {
      icon: Shield,
      title: "Stay Protected",
      description: "Benefit from our insurance coverage and secure payment processing.",
    },
    {
      icon: Clock,
      title: "Flexible Schedule",
      description: "You're in control - set your own schedule and availability.",
    },
  ]

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">How To Become a SpaceOnGo Host?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our community of successful hosts and start monetizing your space today. It's simple, secure, and
            profitable.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="order-2 lg:order-1">
            <div className="grid sm:grid-cols-2 gap-6">
              {steps.map((step, index) => (
                <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Image
              src="/images/successful-host-guide.png"
              alt="Successful SpaceOnGo host managing their space business"
              width={600}
              height={500}
              className="rounded-2xl shadow-xl w-full"
            />
          </div>
        </div>

        
      </div>
    </section>
  )
}
