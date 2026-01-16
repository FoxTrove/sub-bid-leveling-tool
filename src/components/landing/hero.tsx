"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle2, Upload, BarChart3, FileCheck, Play } from "lucide-react"
import { WarpGrid } from "./warp-grid"

export function Hero() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const sectionRef = useRef<HTMLElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      sessionStorage.setItem("bidlevel_email", email)
    }
    router.push("/login")
  }

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Background image - subtle */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-slate-950" />
      </div>

      {/* Warping grid effect - above background, below content */}
      <div className="absolute inset-0 z-0">
        <WarpGrid />
      </div>

      {/* Gradient accents */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[128px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[128px] translate-y-1/2" />

      {/* Main content */}
      <div className="container relative z-10 flex min-h-screen items-center py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

          {/* Left column - Text content */}
          <div className="text-center lg:text-left">
            {/* Pill badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              </span>
              AI-Powered Bid Leveling
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white">
              Level Sub Bids{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">in Minutes</span>
              <br />
              <span className="text-slate-500">Not Hours</span>
            </h1>

            <p className="mt-6 text-lg text-slate-400 md:text-xl max-w-xl mx-auto lg:mx-0">
              Upload subcontractor bids and let AI normalize them apples-to-apples.
              See scope gaps, exclusions, and get a recommendation instantly.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full max-w-xs bg-slate-900/80 backdrop-blur-sm border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
              <Button type="submit" size="lg" className="w-full sm:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="mt-4 text-sm text-slate-500">
              5 free comparisons. No credit card required.
            </p>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-3">
              {[
                "Compare 3-5 bids",
                "AI analysis",
                "PDF export",
                "Scope gaps",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-slate-400">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - Visual/Product preview */}
          <div className="relative lg:pl-8">
            {/* Mockup card */}
            <div className="relative rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-6 shadow-2xl shadow-black/50">
              {/* Card header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-semibold">Bid Comparison</h3>
                  <p className="text-sm text-slate-500">Electrical Trade • 4 Bids</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Analysis Complete
                </div>
              </div>

              {/* Mini chart mockup */}
              <div className="space-y-3 mb-6">
                {[
                  { name: "ABC Electric", price: "$245,000", width: "100%", recommended: true },
                  { name: "PowerTech Inc", price: "$258,500", width: "95%", recommended: false },
                  { name: "Volt Solutions", price: "$267,200", width: "88%", recommended: false },
                  { name: "Spark Contractors", price: "$289,000", width: "75%", recommended: false },
                ].map((bid, i) => (
                  <div key={bid.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={bid.recommended ? "text-white font-medium" : "text-slate-400"}>
                        {bid.name}
                        {bid.recommended && (
                          <span className="ml-2 text-xs text-emerald-400">✓ Recommended</span>
                        )}
                      </span>
                      <span className={bid.recommended ? "text-white" : "text-slate-500"}>{bid.price}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          bid.recommended
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : "bg-slate-700"
                        }`}
                        style={{ width: bid.width, transitionDelay: `${i * 150}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Scope gaps indicator */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-400">3 Scope Gaps Detected</p>
                  <p className="text-xs text-slate-500">Fire alarm, conduit, permit fees</p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 h-24 w-24 bg-blue-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 bg-indigo-500/20 rounded-full blur-2xl" />
            </div>

            {/* Floating stats */}
            <div className="absolute -top-4 -left-4 lg:-left-8 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">3-5</p>
                  <p className="text-xs text-slate-500">Bids per comparison</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 lg:-right-8 rounded-xl bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">~2 min</p>
                  <p className="text-xs text-slate-500">Average analysis time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-10" />
    </section>
  )
}
