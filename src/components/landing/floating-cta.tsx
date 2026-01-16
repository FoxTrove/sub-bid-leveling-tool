"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      const shouldShow = window.scrollY > 500
      setIsVisible(shouldShow)

      // Hide when near the bottom (near the CTA section)
      const bottomThreshold = document.documentElement.scrollHeight - window.innerHeight - 600
      setIsAtBottom(window.scrollY > bottomThreshold)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        isVisible && !isAtBottom
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <Link href="/login">
        <Button
          size="lg"
          className="shadow-2xl shadow-blue-600/30 bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 h-12 font-semibold"
        >
          Start for Free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
