"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle2, Ruler, FileText, Calculator } from "lucide-react"

export function Hero() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      sessionStorage.setItem("bidlevel_email", email)
    }
    router.push("/login")
  }

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background image placeholder */}
      <div className="absolute inset-0 -z-30">
        {/* Replace /hero-bg.jpg with your actual background image */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-secondary" />
        {/* Uncomment when you have the image:
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-15"
          priority
        />
        */}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-20 gradient-hero" />

      {/* Geometric pattern accent - top right */}
      <div className="absolute -right-20 -top-20 h-96 w-96 pattern-grid opacity-40 rotate-12" />

      {/* Geometric pattern accent - bottom left */}
      <div className="absolute -left-20 -bottom-20 h-72 w-72 pattern-grid opacity-30 -rotate-12" />

      {/* Floating construction icons */}
      <div className="absolute left-[10%] top-[20%] animate-float-slow hidden lg:block">
        <div className="rounded-xl bg-primary/10 p-3 backdrop-blur-sm">
          <Ruler className="h-8 w-8 text-primary/40" />
        </div>
      </div>
      <div className="absolute right-[15%] top-[30%] animate-float hidden lg:block" style={{ animationDelay: "1s" }}>
        <div className="rounded-xl bg-accent/10 p-3 backdrop-blur-sm">
          <FileText className="h-8 w-8 text-accent/50" />
        </div>
      </div>
      <div className="absolute left-[15%] bottom-[25%] animate-float hidden lg:block" style={{ animationDelay: "2s" }}>
        <div className="rounded-xl bg-primary/10 p-3 backdrop-blur-sm">
          <Calculator className="h-8 w-8 text-primary/40" />
        </div>
      </div>

      {/* Main content */}
      <div className="container relative flex min-h-[90vh] items-center py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Pill badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            AI-Powered Bid Leveling
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Level Your Sub Bids{" "}
            <span className="text-gradient">in Minutes</span>
            <br className="hidden sm:block" />
            <span className="text-muted-foreground"> Not Hours</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Upload 3-5 subcontractor bids and let AI normalize them apples-to-apples.
            See scope gaps, exclusions, true pricing, and get a recommendation instantly.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full max-w-xs bg-background/80 backdrop-blur-sm border-border/50"
            />
            <Button type="submit" size="lg" className="w-full sm:w-auto h-12 px-8 shadow-lg shadow-primary/20">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            5 free comparisons included. No credit card required.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {[
              "Compare 3-5 bids",
              "AI-powered analysis",
              "PDF export",
              "Scope gap detection",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: `${Math.random() * 0.3}s` }}>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Trust indicator */}
          <div className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-background flex items-center justify-center text-xs font-medium"
                >
                  {["JD", "MK", "TR", "AS"][i - 1]}
                </div>
              ))}
            </div>
            <span>Trusted by estimators at leading GCs</span>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
