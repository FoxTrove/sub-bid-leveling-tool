import Link from "next/link"
import { Scale } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col leading-none">
              <span className="font-semibold">BidLevel</span>
              <span className="text-[10px] text-muted-foreground">by Foxtrove.ai</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Foxtrove.ai. All rights reserved.
          </p>

          <nav className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
