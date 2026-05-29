import { Button } from "@/components/ui/button"
import { MessageCircle, Mail } from "lucide-react"

export default function HelpHero() {
  return (
    <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16 lg:py-24">
      <div className="container mx-auto px-4 text-center">
        <h1
          className="font-bold text-gray-900 mb-[36px] md:mb-4 text-balance px-4"
          style={{ fontSize: "clamp(1.5rem, 4vw + 0.5rem, 3rem)" }} // Fluid scaling from 24px to 48px
        >
          How can we help you?
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4 text-balance">
          Find answers to common questions or get in touch with our support team
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
          <Button
            size="lg"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Mail className="h-5 w-5" />
            Email Us
          </Button>
        </div>
      </div>
    </section>
  )
}
