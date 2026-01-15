"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="border-t bg-primary py-20 text-primary-foreground">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Stop Wrestling with Spreadsheets?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join construction GCs who are saving hours on every bid with
            BidLevel. Free for 30 days.
          </p>

          <Link href="/login">
            <Button
              size="lg"
              variant="secondary"
              className="mt-8"
            >
              Start Leveling Bids Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
