"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Scale } from "lucide-react"

interface HeaderProps {
  showAuth?: boolean
}

export function Header({ showAuth = true }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-200 ${
      scrolled ? "shadow-md shadow-black/5" : ""
    }`}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-gradient">BidLevel</span>
            <span className="text-[10px] text-muted-foreground">by Foxtrove.ai</span>
          </div>
        </Link>

        {showAuth && (
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                Get Started Free
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
