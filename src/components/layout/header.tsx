"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

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
        <Link href="/" className="flex items-center group transition-opacity hover:opacity-80">
          <Image
            src="/bidvet-logo.png"
            alt="BidVet"
            width={140}
            height={40}
            className="h-8 w-auto"
            priority
          />
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
