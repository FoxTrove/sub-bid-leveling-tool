"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function Hero() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Store email in sessionStorage for pre-fill on login page
    if (email) {
      sessionStorage.setItem("bidlevel_email", email)
    }
    router.push("/login")
  }

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.12),transparent)]" />

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Level Your Sub Bids
            <span className="text-primary"> in Minutes</span>, Not Hours
          </h1>

          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Upload 3-5 subcontractor bids and let AI normalize them
            apples-to-apples. See scope gaps, exclusions, true pricing, and get
            a recommendation instantly.
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
              className="h-12 w-full max-w-xs"
            />
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            Free for 30 days. No credit card required.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4">
            {[
              "Compare 3-5 bids",
              "AI-powered analysis",
              "PDF export",
              "Scope gap detection",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
