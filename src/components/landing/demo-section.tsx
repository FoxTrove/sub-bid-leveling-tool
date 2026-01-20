"use client"

import { useState, useEffect } from "react"
import { Upload, FileText, Loader2, CheckCircle2, BarChart3, Download, Play, Pause, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const demoSteps = [
  {
    id: "upload",
    title: "Upload Bids",
    duration: 2500,
  },
  {
    id: "processing",
    title: "AI Analysis",
    duration: 3000,
  },
  {
    id: "results",
    title: "View Results",
    duration: 6000,
  },
]

// Mock contractor breakdown data
const contractorBreakdowns = [
  {
    name: "ABC Electric",
    baseBid: 245000,
    exclusions: 0,
    trueCost: 245000,
    recommended: true,
    confidence: 0.94,
    items: [
      { description: "Main electrical panels", price: 45000, status: "included" },
      { description: "Conduit & wiring", price: 82000, status: "included" },
      { description: "Fire alarm system", price: 34000, status: "included" },
      { description: "Lighting fixtures", price: 56000, status: "included" },
      { description: "Emergency backup", price: 28000, status: "included" },
    ],
  },
  {
    name: "PowerTech Inc",
    baseBid: 218500,
    exclusions: 42000,
    trueCost: 260500,
    recommended: false,
    confidence: 0.87,
    items: [
      { description: "Main electrical panels", price: 48500, status: "included" },
      { description: "Conduit & wiring", price: null, status: "excluded" },
      { description: "Fire alarm system", price: 34000, status: "included" },
      { description: "Lighting fixtures", price: 52000, status: "included" },
      { description: "Emergency backup", price: null, status: "excluded" },
    ],
  },
  {
    name: "Volt Solutions",
    baseBid: 267200,
    exclusions: 0,
    trueCost: 267200,
    recommended: false,
    confidence: 0.91,
    items: [
      { description: "Main electrical panels", price: 51200, status: "included" },
      { description: "Conduit & wiring", price: 79200, status: "included" },
      { description: "Fire alarm system", price: 31500, status: "included" },
      { description: "Lighting fixtures", price: 58300, status: "included" },
      { description: "Emergency backup", price: 47000, status: "included" },
    ],
  },
]

export function DemoSection() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [expandedContractor, setExpandedContractor] = useState<string | null>("ABC Electric")

  useEffect(() => {
    if (!isPlaying) return

    const step = demoSteps[currentStep]
    const interval = 50
    const increment = (interval / step.duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((s) => (s + 1) % demoSteps.length)
          return 0
        }
        return prev + increment
      })
    }, interval)

    return () => clearInterval(timer)
  }, [currentStep, isPlaying])

  const stepId = demoSteps[currentStep].id

  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-600 mb-4">
            <Play className="h-4 w-4" />
            How It Works
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            From Upload to Insights in 2 Minutes
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Upload your bids, let AI do the heavy lifting, and get actionable comparisons with detailed breakdowns.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Demo Window */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            {/* Window Chrome */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="ml-4 text-sm text-slate-400">app.bidvet.com</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-slate-400 hover:text-white"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
            </div>

            {/* Demo Content */}
            <div className="p-6 md:p-8 min-h-[500px] relative">
              {/* Step 1: Upload */}
              <div
                className={cn(
                  "absolute inset-6 md:inset-8 transition-all duration-500",
                  stepId === "upload"
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-full max-w-md">
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors">
                      <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-blue-400" />
                      </div>
                      <p className="text-white font-medium mb-2">Drop your bid documents here</p>
                      <p className="text-sm text-slate-500">PDF, Excel, or Word files (up to 25MB each)</p>
                    </div>

                    {/* Animated files dropping */}
                    <div className="mt-6 space-y-2">
                      {["ABC_Electric_Bid.pdf", "PowerTech_Proposal.pdf", "Volt_Solutions_Quote.xlsx"].map(
                        (file, i) => (
                          <div
                            key={file}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg bg-slate-800 transition-all duration-500",
                              progress > (i + 1) * 25 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                            )}
                            style={{ transitionDelay: `${i * 150}ms` }}
                          >
                            <FileText className="h-5 w-5 text-blue-400" />
                            <span className="text-sm text-slate-300">{file}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-auto" />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Processing */}
              <div
                className={cn(
                  "absolute inset-6 md:inset-8 transition-all duration-500",
                  stepId === "processing"
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />
                  </div>

                  <h3 className="mt-8 text-xl font-semibold text-white">AI is analyzing your bids...</h3>

                  <div className="mt-6 space-y-3 text-sm text-slate-400 max-w-sm">
                    {[
                      { text: "Extracting scope items from PDFs", done: progress > 20 },
                      { text: "Identifying exclusions & inclusions", done: progress > 40 },
                      { text: "Normalizing line items across bids", done: progress > 60 },
                      { text: "Calculating true costs", done: progress > 80 },
                      { text: "Generating recommendation", done: progress > 95 },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3">
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-600 animate-pulse" />
                        )}
                        <span className={item.done ? "text-slate-300" : ""}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Results with Detailed Breakdown */}
              <div
                className={cn(
                  "absolute inset-6 md:inset-8 transition-all duration-500 overflow-y-auto",
                  stepId === "results"
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
                )}
              >
                <div className="h-full">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Comparison Complete</h3>
                      <p className="text-sm text-slate-500">3 bids analyzed - Electrical Trade</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">$245K</p>
                      <p className="text-xs text-slate-500">Lowest True Cost</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">2</p>
                      <p className="text-xs text-slate-500">Scope Gaps Found</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-400">94%</p>
                      <p className="text-xs text-slate-500">AI Confidence</p>
                    </div>
                  </div>

                  {/* Detailed Contractor Breakdowns */}
                  <div className="space-y-2">
                    {contractorBreakdowns.map((contractor) => (
                      <div
                        key={contractor.name}
                        className={cn(
                          "rounded-lg border transition-all",
                          contractor.recommended
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-slate-800/50 border-slate-700"
                        )}
                      >
                        {/* Contractor Header */}
                        <button
                          onClick={() => setExpandedContractor(
                            expandedContractor === contractor.name ? null : contractor.name
                          )}
                          className="w-full p-3 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-medium",
                                contractor.recommended ? "text-white" : "text-slate-300"
                              )}>
                                {contractor.name}
                                {contractor.recommended && (
                                  <span className="ml-2 text-xs text-emerald-400">Recommended</span>
                                )}
                              </span>
                              <span className="text-xs text-slate-500">
                                Base: ${(contractor.baseBid / 1000).toFixed(0)}K
                                {contractor.exclusions > 0 && (
                                  <span className="text-amber-400 ml-2">
                                    + ${(contractor.exclusions / 1000).toFixed(0)}K exclusions
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "font-bold",
                              contractor.recommended ? "text-emerald-400" : "text-white"
                            )}>
                              ${(contractor.trueCost / 1000).toFixed(0)}K
                            </span>
                            {expandedContractor === contractor.name ? (
                              <ChevronUp className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Line Items */}
                        {expandedContractor === contractor.name && (
                          <div className="px-3 pb-3 border-t border-slate-700/50 mt-1 pt-3">
                            <div className="space-y-1.5 text-xs">
                              {contractor.items.map((item, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded",
                                    item.status === "excluded"
                                      ? "bg-red-500/10 border border-red-500/20"
                                      : "bg-slate-800/50"
                                  )}
                                >
                                  <span className="text-slate-400">{item.description}</span>
                                  {item.status === "excluded" ? (
                                    <span className="flex items-center gap-1 text-red-400">
                                      <AlertTriangle className="h-3 w-3" />
                                      EXCLUDED
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">
                                      ${item.price?.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-800">
              <div className="flex items-center gap-4">
                {demoSteps.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setCurrentStep(i)
                      setProgress(0)
                    }}
                    className="flex-1"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                          i <= currentStep
                            ? "bg-blue-500 text-white"
                            : "bg-slate-700 text-slate-400"
                        )}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-sm transition-colors hidden sm:inline",
                          i === currentStep ? "text-white" : "text-slate-500"
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{
                          width:
                            i < currentStep
                              ? "100%"
                              : i === currentStep
                              ? `${progress}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature callouts below demo */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Upload, title: "Any Format", desc: "PDF, Excel, Word" },
              { icon: BarChart3, title: "Scope Gaps", desc: "Auto-detected" },
              { icon: CheckCircle2, title: "AI Recommendation", desc: "Best value pick" },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="font-medium text-slate-900 text-sm">{feature.title}</p>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
