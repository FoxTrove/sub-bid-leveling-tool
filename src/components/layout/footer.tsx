import Link from "next/link"
import { Scale, Twitter, Linkedin, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative border-t bg-secondary/30 overflow-hidden">
      {/* Subtle pattern accent */}
      <div className="absolute -right-20 -bottom-20 h-64 w-64 pattern-grid opacity-20 rotate-12" />

      <div className="container relative py-16">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Scale className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-gradient">BidVet</span>
                <span className="text-[10px] text-muted-foreground">by Foxtrove.ai</span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              AI-powered bid leveling for construction general contractors.
              Compare subcontractor bids in minutes, not hours.
            </p>
            {/* Social links */}
            <div className="mt-6 flex gap-3">
              <a
                href="https://twitter.com/foxtroveai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/company/foxtrove"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@foxtrove.ai"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Product</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Get Started
              </Link>
            </nav>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Legal</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Foxtrove.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
