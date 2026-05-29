"use client"

import {
  Home,
  Briefcase,
  Utensils,
  Camera,
  Warehouse,
  Building,
  Users,
  PartyPopper,
  Mic,
  Coffee,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function SpaceCategories() {
  const categories = [
    { name: "Office", icon: Briefcase, href: "/all-spaces?type=Office" },
    { name: "Co-working", icon: Building, href: "/all-spaces?type=Co-working" },
    { name: "Restaurant", icon: Utensils, href: "/all-spaces?type=Restaurant" },
    { name: "Cafe", icon: Coffee, href: "/all-spaces?type=Cafe" },
    { name: "Studio", icon: Camera, href: "/all-spaces?type=Studio" },
    { name: "Storage", icon: Warehouse, href: "/all-spaces?type=Storage" },
    { name: "Home", icon: Home, href: "/all-spaces?type=Home" },
    { name: "Business Center", icon: Building, href: "/all-spaces?type=Business Center" },
    { name: "Conference Room", icon: Users, href: "/all-spaces?type=Conference Room" },
    { name: "Event Space", icon: PartyPopper, href: "/all-spaces?type=Event Space" },
    { name: "Greenroom", icon: Mic, href: "/all-spaces?type=Greenroom" },
  ]

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setShowLeftArrow(container.scrollLeft > 0)
    setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 10)
  }

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" })
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 border-b border-gray-100">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-4">
        {/* Left Arrow - Fixed width column */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className={`h-10 w-10 rounded-full bg-background shadow-md hover:bg-accent transition-opacity ${
              showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Icon Container - Takes remaining space */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-6 md:gap-8 lg:gap-10 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex flex-col items-center gap-2 min-w-[80px] flex-shrink-0 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 group"
            >
              <category.icon className="h-8 w-8 group-hover:text-primary transition-colors" />
              <span className="text-center leading-tight whitespace-nowrap">{category.name}</span>
            </Link>
          ))}
        </div>

        {/* Right Arrow - Fixed width column */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className={`h-10 w-10 rounded-full bg-background shadow-md hover:bg-accent transition-opacity ${
              showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
