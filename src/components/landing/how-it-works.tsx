"use client"

import { useEffect, useRef, useState } from "react"
import { Upload, Cpu, FileCheck, ArrowRight, FileText, Sparkles, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    icon: Upload,
    title: "Upload Your Bids",
    description:
      "Drag and drop 3-5 subcontractor bid documents. We support PDFs, Excel files, and Word docs.",
    details: ["PDF, Excel, Word support", "Up to 25MB per file", "Batch upload available"],
    visual: (
      <div className="space-y-2">
        {["Bid_ABC_Electric.pdf", "PowerTech_Quote.xlsx", "Volt_Proposal.pdf"].map((file, i) => (
          <div
            key={file}
            className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-slate-700">{file}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Cpu,
    title: "AI Analyzes Everything",
    description:
      "Our AI extracts scope items, pricing, and exclusions from each bid and normalizes them for comparison.",
    details: ["Scope item extraction", "Exclusion detection", "Price normalization"],
    visual: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
          <div className="flex-1">
            <div className="text-sm text-blue-600 mb-1">Processing...</div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {["47 items extracted", "3 exclusions found", "Prices normalized", "Gaps identified"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-slate-600">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: FileCheck,
    title: "Get Your Comparison",
    description:
      "See a side-by-side comparison with scope gaps, exclusions highlighted, and an AI recommendation.",
    details: ["Side-by-side view", "AI recommendation", "PDF export ready"],
    visual: (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">ABC Electric</span>
          </div>
          <span className="text-sm text-emerald-600">Recommended</span>
        </div>
        {[
          { name: "PowerTech", price: "$261k" },
          { name: "Volt Solutions", price: "$267k" },
        ].map((bid) => (
          <div key={bid.name} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-sm text-slate-600">{bid.name}</span>
            <span className="text-sm text-slate-500">{bid.price}</span>
          </div>
        ))}
      </div>
    ),
  },
]

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = stepRefs.current.findIndex((ref) => ref === entry.target)
          if (entry.isIntersecting && index !== -1) {
            setVisibleSteps((prev) => [...new Set([...prev, index])])
            if (entry.intersectionRatio > 0.5) {
              setActiveStep(index)
            }
          }
        })
      },
      { threshold: [0.2, 0.5, 0.8] }
    )

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden bg-white">
      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
            Simple Process
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Three simple steps to level your subcontractor bids
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              ref={(el) => { stepRefs.current[index] = el }}
              className={cn(
                "relative grid md:grid-cols-2 gap-8 md:gap-16 items-center py-16",
                index !== steps.length - 1 && "border-b border-slate-200"
              )}
            >
              {/* Content - alternating sides */}
              <div
                className={cn(
                  "transition-all duration-700",
                  visibleSteps.includes(index)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8",
                  index % 2 === 1 && "md:order-2"
                )}
              >
                {/* Step indicator */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-500",
                    activeStep === index
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-600">Step {index + 1}</div>
                    <h3 className="text-2xl font-bold text-slate-900">{step.title}</h3>
                  </div>
                </div>

                <p className="text-slate-600 text-lg mb-6">{step.description}</p>

                <ul className="space-y-2">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-3 text-slate-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <div
                className={cn(
                  "transition-all duration-700 delay-200",
                  visibleSteps.includes(index)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8",
                  index % 2 === 1 && "md:order-1"
                )}
              >
                <div className="rounded-2xl bg-slate-100 border border-slate-200 p-6 shadow-sm">
                  {step.visual}
                </div>
              </div>

              {/* Connecting arrow (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-500",
                    visibleSteps.includes(index + 1)
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-400"
                  )}>
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
