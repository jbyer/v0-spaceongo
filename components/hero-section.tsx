"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import Link from "next/link"

type HeroContent = {
  type: "image" | "video" | "slideshow"
  title: string
  subtitle: string
  cta: {
    text: string
    href: string
  }
  media?: {
    src: string
    alt?: string
    poster?: string
  }
  slides?: {
    src: string
    alt: string
    title: string
    subtitle: string
  }[]
}

const heroContent: HeroContent = {
  type: "slideshow",
  title: "Find Your Perfect Space",
  subtitle: "Transform your vision into reality with inspiring spaces",
  cta: {
    text: "Start Your Journey",
    href: "/find-space",
  },
  slides: [
    {
      src: "/images/hero_creative-studio.png",
      alt: "Creative studio with natural light",
      title: "Create Within Inspired Walls",
      subtitle: "Discover studios that spark creativity and bring your vision to life",
    },
    {
      src: "/images/hero_event-space.png",
      alt: "Modern event space with city views",
      title: "Celebrate Life's Moments",
      subtitle: "Find the perfect venue to make your special occasions unforgettable",
    },
    {
      src: "/images/hero_workspace.png",
      alt: "Collaborative workspace with team",
      title: "Build Your Dreams Together",
      subtitle: "Professional spaces designed to elevate your team's productivity",
    },
    {
      src: "/images/hero_meeting-room.png",
      alt: "Cozy meeting room with modern design",
      title: "Where Ideas Come to Life",
      subtitle: "Intimate spaces perfect for meaningful conversations and breakthrough moments",
    },
  ],
}

const SLIDE_DURATION = 4000

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(Date.now())

  const nextSlide = useCallback(() => {
    if (heroContent.slides) {
      setCurrentSlide((prev) => (prev + 1) % heroContent.slides!.length)
      setProgress(0)
      lastTickRef.current = Date.now()
    }
  }, [])

  const prevSlide = useCallback(() => {
    if (heroContent.slides) {
      setCurrentSlide((prev) => (prev - 1 + heroContent.slides!.length) % heroContent.slides!.length)
      setProgress(0)
      lastTickRef.current = Date.now()
    }
  }, [])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setProgress(0)
    lastTickRef.current = Date.now()
  }, [])

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
    lastTickRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (heroContent.type !== "slideshow" || !isPlaying || !heroContent.slides) {
      if (progressRef.current) cancelAnimationFrame(progressRef.current)
      return
    }

    const tick = () => {
      const now = Date.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now

      setProgress((prev) => {
        const next = prev + (delta / SLIDE_DURATION) * 100
        if (next >= 100) {
          setCurrentSlide((s) => (s + 1) % heroContent.slides!.length)
          return 0
        }
        return next
      })
      progressRef.current = requestAnimationFrame(tick)
    }

    lastTickRef.current = Date.now()
    progressRef.current = requestAnimationFrame(tick)
    return () => {
      if (progressRef.current) cancelAnimationFrame(progressRef.current)
    }
  }, [isPlaying])

  const renderContent = () => {
    switch (heroContent.type) {
      case "image":
        return (
          <div className="absolute inset-0">
            <Image
              src={heroContent.media?.src || "/placeholder.svg?height=600&width=1400&text=Hero+Image"}
              alt={heroContent.media?.alt || "Hero image"}
              fill
              className="object-cover max-h-[600px]"
              priority
            />
          </div>
        )

      case "video":
        return (
          <div className="absolute inset-0">
            <video
              className="w-full h-full object-cover max-h-[600px]"
              autoPlay={isVideoPlaying}
              muted
              loop
              poster={heroContent.media?.poster}
            >
              <source src={heroContent.media?.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-6 right-6 bg-white/90 hover:bg-white backdrop-blur-sm"
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
            >
              {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        )

      case "slideshow":
        return (
          <div
            className="absolute inset-0"
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured spaces slideshow"
          >
            <div aria-live={isPlaying ? "off" : "polite"} aria-atomic="true">
              {heroContent.slides?.map((slide, index) => (
                <div
                  key={index}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Slide ${index + 1} of ${heroContent.slides!.length}: ${slide.title}`}
                  aria-hidden={index !== currentSlide}
                  className={`absolute inset-0 transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    index === currentSlide
                      ? "opacity-100 scale-100 z-[1]"
                      : "opacity-0 scale-[1.03] z-0"
                  }`}
                >
                  <Image
                    src={slide.src || "/placeholder.svg"}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
                    quality={90}
                    onError={() => {
                      setImageErrors((prev) => ({ ...prev, [index]: true }))
                    }}
                  />
                  {imageErrors[index] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-white text-center">
                        <p className="text-xl">Space Image</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-6 z-[2] pointer-events-none">
              <Button
                variant="outline"
                size="icon"
                className="pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white hover:text-black transition-all duration-200"
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white hover:text-black transition-all duration-200"
                onClick={nextSlide}
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-6 right-4 sm:right-6 z-[2] bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white hover:text-black transition-all duration-200"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2] flex items-center gap-3"
              role="tablist"
              aria-label="Slide indicators"
            >
              {heroContent.slides?.map((slide, index) => (
                <button
                  key={index}
                  role="tab"
                  aria-selected={index === currentSlide}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  className="relative w-8 h-2 rounded-full overflow-hidden bg-white/30 transition-all duration-300 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
                  onClick={() => goToSlide(index)}
                >
                  {index === currentSlide && (
                    <span
                      className="absolute inset-y-0 left-0 bg-white rounded-full"
                      style={{ width: `${progress}%`, transition: "width 60ms linear" }}
                    />
                  )}
                  {index !== currentSlide && index < currentSlide && (
                    <span className="absolute inset-0 bg-white/70 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getCurrentContent = () => {
    if (heroContent.type === "slideshow" && heroContent.slides) {
      return heroContent.slides[currentSlide]
    }
    return heroContent
  }

  const currentContent = getCurrentContent()

  return (
    <section className="relative h-[70vh] sm:h-[55vh] md:h-[55vh] lg:h-[50vh] overflow-hidden bg-gray-900">
      {renderContent()}

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />

      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center text-white px-6 max-w-5xl mx-auto">
          <div className="mb-4 md:mb-3">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-white drop-shadow-2xl text-balance"
              style={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)",
                fontSize: "clamp(1.875rem, 5vw + 1rem, 4.5rem)",
              }}
            >
              <span className="block animate-fade-in-up">{currentContent.title || heroContent.title}</span>
            </h1>
            <div className="w-24 h-1 bg-white mx-auto rounded-full opacity-80"></div>
          </div>

          <p
            className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-6 text-white max-w-3xl mx-auto leading-relaxed font-light drop-shadow-lg text-balance"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)",
              backgroundColor: "rgba(0,0,0,0.3)",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              backdropFilter: "blur(4px)",
              fontSize: "clamp(1rem, 2.5vw + 0.5rem, 1.875rem)",
            }}
          >
            {currentContent.subtitle || heroContent.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-10 py-4 bg-green-600 hover:bg-green-700 text-white border-0 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href={heroContent.cta.href}>{heroContent.cta.text}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-10 py-4 bg-black/40 border-2 border-white text-white hover:bg-white hover:text-black rounded-full backdrop-blur-md shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/about">Discover Our Story</Link>
            </Button>
          </div>

          <div
            className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-white drop-shadow-md"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm font-medium tracking-wider uppercase">Verified Locations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-sm font-medium tracking-wider uppercase">Instant Booking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
