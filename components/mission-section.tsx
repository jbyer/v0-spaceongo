import { Card, CardContent } from "@/components/ui/card"
import { Target, Heart, Lightbulb, Users } from "lucide-react"

export default function MissionSection() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description:
        "To democratize space access by connecting people with ideal environments while helping owners maximize it's potential.",
    },
    {
      icon: Heart,
      title: "Community First",
      description:
        "We believe in building strong communities by connecting people with spaces that inspire collaboration, creativity, and growth.",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description:
        "We continuously innovate to provide cutting-edge solutions that simplify the space rental process for both providers and renters.",
    },
    {
      icon: Users,
      title: "Trust & Safety",
      description:
        "We prioritize the safety and security of our community through verified listings, secure payments, and comprehensive support.",
    },
  ]

  return (
    <section id="mission" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Mission & Values</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're driven by a simple belief: great things happen when people have access to great spaces.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
