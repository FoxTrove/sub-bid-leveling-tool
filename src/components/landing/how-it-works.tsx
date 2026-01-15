"use client"

import { Upload, Cpu, FileCheck, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Upload Your Bids",
    description:
      "Drag and drop 3-5 subcontractor bid documents. We support PDFs, Excel files, and Word docs.",
  },
  {
    icon: Cpu,
    title: "AI Analyzes Everything",
    description:
      "Our AI extracts scope items, pricing, and exclusions from each bid and normalizes them for comparison.",
  },
  {
    icon: FileCheck,
    title: "Get Your Comparison",
    description:
      "See a side-by-side comparison with scope gaps, exclusions highlighted, and an AI recommendation.",
  },
]

export function HowItWorks() {
  return (
    <section className="relative border-t bg-secondary/50 py-24 overflow-hidden">
      {/* Blueprint-style background */}
      <div className="absolute inset-0 pattern-grid opacity-50" />

      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            Simple Process
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to level your subcontractor bids
          </p>
        </div>

        <div className="mt-16 relative">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-30" />

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Step number with gradient */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="gradient-cta rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-primary/30">
                    Step {index + 1}
                  </div>
                </div>

                {/* Icon container with glow effect */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-background border-2 border-primary/20 shadow-lg">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                </div>

                {/* Arrow between steps - desktop only */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-10 -right-4 z-20">
                    <ArrowRight className="h-5 w-5 text-accent" />
                  </div>
                )}

                {/* Content */}
                <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-muted-foreground max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
