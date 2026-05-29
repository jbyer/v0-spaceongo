import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutHero() {
  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-balance mb-[20px] md:mb-0"
              style={{ fontSize: "clamp(1.875rem, 5vw + 0.5rem, 3.75rem)" }} // Fluid scaling from 30px to 60px
            >
              Connecting Spaces,
              <span className="text-blue-600"> Empowering Dreams</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed text-balance">
              At SpaceOnGo, we believe every space has potential and every dream deserves a place to flourish. We're
              revolutionizing how people discover, book, and utilize spaces for work, creativity, and connection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/find-space">Explore Spaces</Link>
              </Button>
            </div>
          </div>
          <div className="relative flex justify-center lg:block">
            <div className="relative max-w-[600px] w-full">
              <Image
                src="/images/about-hero-mission.png"
                alt="SpaceOnGo team collaborating in modern workspace"
                width={600}
                height={500}
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold text-blue-600">10,000+</div>
                <div className="text-sm text-gray-600">Spaces Connected</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
