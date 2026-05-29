import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-r from-green-700 to-blue-700 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4 drop-shadow-lg">Ready to Find Your Perfect Space?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-95 drop-shadow-md">
          Join thousands of satisfied users who have found their ideal spaces through SpaceOnGo. Start your journey
          today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/find-space">Find a Space</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-lg px-8 border-2 border-white text-white hover:bg-white hover:text-gray-900 bg-white/10 backdrop-blur-sm"
          >
            <Link href="/list-space">List Your Space</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
