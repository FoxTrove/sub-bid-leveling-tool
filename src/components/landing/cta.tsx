"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Clock } from "lucide-react"

const trustPoints = [
  { icon: Shield, text: "No credit card required" },
  { icon: Zap, text: "3 free comparisons" },
  { icon: Clock, text: "Results in minutes" },
]

export function CTA() {
  return (
    <section className="relative border-t overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-cta" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 pattern-grid opacity-10" />

      {/* Decorative elements */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Ready to Stop Wrestling with Spreadsheets?
          </h2>
          <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto">
            Join construction GCs who are saving hours on every bid comparison.
            Start with 3 free comparisons—no credit card needed.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-base shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-shadow"
              >
                Start Leveling Bids Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="ghost"
                className="h-14 px-8 text-base text-white/90 hover:text-white hover:bg-white/10"
              >
                View Pricing
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {trustPoints.map((point) => (
              <div key={point.text} className="flex items-center gap-2 text-white/70">
                <point.icon className="h-4 w-4" />
                <span className="text-sm">{point.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
