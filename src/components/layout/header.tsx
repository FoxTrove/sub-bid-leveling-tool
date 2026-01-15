"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Scale } from "lucide-react"

interface HeaderProps {
  showAuth?: boolean
}

export function Header({ showAuth = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold">BidLevel</span>
            <span className="text-[10px] text-muted-foreground">by Foxtrove.ai</span>
          </div>
        </Link>

        {showAuth && (
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started Free</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
