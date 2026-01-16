"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, FileSpreadsheet, Clock, HelpCircle, CheckCircle2, Sparkles, RefreshCw, Trash2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProblemSection() {
  const [activeView, setActiveView] = useState<"before" | "after">("before")
  const [isPaused, setIsPaused] = useState(false)
  const [flickerCells, setFlickerCells] = useState<number[]>([])

  // Auto-cycle between views
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setActiveView((prev) => (prev === "before" ? "after" : "before"))
    }, 5000) // Switch every 5 seconds

    return () => clearInterval(interval)
  }, [isPaused])

  // Random cell flickering for chaos effect
  useEffect(() => {
    if (activeView !== "before") return

    const flickerInterval = setInterval(() => {
      const randomCells = Array.from({ length: 3 }, () => Math.floor(Math.random() * 20))
      setFlickerCells(randomCells)
    }, 800)

    return () => clearInterval(flickerInterval)
  }, [activeView])

  const handleToggle = (view: "before" | "after") => {
    setActiveView(view)
    setIsPaused(true)
    // Resume auto-cycling after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000)
  }

  return (
    <section className="py-24 bg-slate-950 text-white overflow-hidden">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-1.5 text-sm font-medium text-red-400 mb-4">
            <AlertTriangle className="h-4 w-4" />
            The Problem
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Spreadsheet Bid Leveling is{" "}
            <span className="text-red-400">Broken</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            You're spending hours reformatting bids, hunting for exclusions, and hoping you didn't miss anything critical.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-full bg-slate-800 p-1">
            <button
              onClick={() => handleToggle("before")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                activeView === "before"
                  ? "bg-red-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              )}
            >
              The Old Way
            </button>
            <button
              onClick={() => handleToggle("after")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                activeView === "after"
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              )}
            >
              With BidLevel
            </button>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="relative max-w-5xl mx-auto">
          {/* Before View - Chaotic Spreadsheet */}
          <div
            className={cn(
              "transition-all duration-500",
              activeView === "before"
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8 absolute inset-0 pointer-events-none"
            )}
          >
            <div className="rounded-2xl bg-slate-900 border border-red-500/20 p-6 md:p-8 relative overflow-hidden">
              {/* Chaotic background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-10 left-20 text-6xl font-bold text-red-500 rotate-12">?!</div>
                <div className="absolute bottom-20 right-40 text-4xl font-bold text-yellow-500 -rotate-6">$$$</div>
                <div className="absolute top-40 right-20 text-5xl font-bold text-orange-500 rotate-[-15deg]">ERROR</div>
              </div>

              {/* Messy Spreadsheet Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="line-through opacity-50">bid_comparison.xlsx</span>
                    <span className="line-through opacity-50">bid_comparison_v2.xlsx</span>
                    <span>bid_comparison_v3_FINAL_revised_USE_THIS.xlsx</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-red-400 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Unsaved changes
                </div>
              </div>

              {/* Chaotic toolbar */}
              <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded">
                  <Copy className="h-3 w-3" />
                  Copy
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded">
                  <RefreshCw className="h-3 w-3" />
                  Undo (47)
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-red-900/50 rounded text-red-400">
                  <Trash2 className="h-3 w-3" />
                  Delete Row?
                </div>
                <div className="px-2 py-1 bg-yellow-900/50 rounded text-yellow-400">
                  #REF! Error in H24
                </div>
              </div>

              {/* Messy Spreadsheet Content */}
              <div className="overflow-x-auto">
                <div className="min-w-[700px] text-xs font-mono">
                  {/* Headers - misaligned and inconsistent */}
                  <div className="grid grid-cols-6 gap-1 mb-2 text-slate-500">
                    <div className="bg-slate-800 p-2 border-l-2 border-yellow-500">Scope Item</div>
                    <div className="bg-slate-800 p-2">ABC Elec.</div>
                    <div className="bg-slate-800 p-2 text-[10px]">PowerTech Electric LLC</div>
                    <div className="bg-slate-800 p-2">Volt</div>
                    <div className="bg-slate-800 p-2">Notes???</div>
                    <div className="bg-red-900/30 p-2 text-red-400">VERIFY!!</div>
                  </div>

                  {/* Rows - maximum chaos */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-6 gap-1">
                      <div className={cn("bg-slate-800/50 p-2 text-slate-300", flickerCells.includes(0) && "bg-yellow-900/50")}>Panel installation</div>
                      <div className="bg-slate-800/50 p-2 text-slate-300">$45,000</div>
                      <div className={cn("bg-slate-800/50 p-2 text-slate-300", flickerCells.includes(1) && "bg-red-900/30")}>$48,500</div>
                      <div className="bg-yellow-900/30 p-2 text-yellow-400 animate-pulse">INCLUDED??</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500">check w/ Jim</div>
                      <div className="bg-red-900/30 p-2 text-red-400">URGENT</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      <div className="bg-slate-800/50 p-2 text-slate-300">Conduit & wiring</div>
                      <div className={cn("bg-slate-800/50 p-2 text-slate-300", flickerCells.includes(2) && "bg-orange-900/30")}>$82,000</div>
                      <div className="bg-red-900/50 p-2 text-red-400 font-bold">EXCLUDED!</div>
                      <div className="bg-slate-800/50 p-2 text-slate-300">$79,200</div>
                      <div className="bg-red-900/30 p-2 text-red-400">MISSED THIS</div>
                      <div className="bg-orange-900/30 p-2 text-orange-400">+$82K?!</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      <div className={cn("bg-slate-800/50 p-2 text-slate-300", flickerCells.includes(3) && "bg-yellow-900/30")}>Fire alarm system</div>
                      <div className="bg-yellow-900/50 p-2 text-yellow-400">???</div>
                      <div className="bg-slate-800/50 p-2 text-slate-300">$34,000</div>
                      <div className="bg-slate-800/50 p-2 text-slate-300">$31,500</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500 italic">need to verify</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500">-</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      <div className="bg-slate-800/50 p-2 text-slate-300">Permit fees</div>
                      <div className="bg-slate-800/50 p-2 text-slate-300">By owner</div>
                      <div className={cn("bg-slate-800/50 p-2 text-slate-300", flickerCells.includes(4) && "bg-red-900/30")}>$2,500</div>
                      <div className="bg-red-900/50 p-2 text-red-400">NOT INCL</div>
                      <div className="bg-orange-900/30 p-2 text-orange-400 font-bold">WHO PAYS?!</div>
                      <div className="bg-red-900/30 p-2 text-red-400">!!!!!</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      <div className="bg-slate-800/50 p-2 text-slate-300">Labor rates</div>
                      <div className="bg-slate-800/50 p-2 text-slate-400 text-[10px]">See pg 4</div>
                      <div className={cn("bg-slate-800/50 p-2 text-slate-400 text-[10px]", flickerCells.includes(5) && "bg-yellow-900/30")}>Attached</div>
                      <div className="bg-slate-800/50 p-2 text-slate-300">$85/hr??</div>
                      <div className="bg-yellow-900/30 p-2 text-yellow-400">apples to oranges</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500">compare?</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1 opacity-60">
                      <div className="bg-slate-800/50 p-2 text-slate-500">(deleted row)</div>
                      <div className="bg-red-900/20 p-2 text-red-400 line-through">$0</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500">-</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500">-</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500">oops</div>
                      <div className="bg-slate-800/50 p-2 text-slate-500">#REF!</div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      <div className="bg-yellow-900/30 p-2 text-yellow-400 font-bold">TOTAL (verify!!!)</div>
                      <div className={cn("bg-slate-800/50 p-2 text-white font-bold", flickerCells.includes(6) && "bg-red-900/30")}>$245,000</div>
                      <div className="bg-red-900/30 p-2 text-red-400 font-bold">$218,500*</div>
                      <div className="bg-slate-800/50 p-2 text-white font-bold">$267,200</div>
                      <div className="bg-orange-900/30 p-2 text-orange-400 text-[10px]">*MISSING SCOPE!</div>
                      <div className="bg-red-900/50 p-2 text-red-400 animate-pulse">WRONG?</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky notes chaos */}
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 p-2 text-xs font-bold rotate-6 shadow-lg">
                ASK JOHN
              </div>
              <div className="absolute bottom-20 -right-4 bg-pink-400 text-pink-900 p-2 text-xs font-bold -rotate-3 shadow-lg">
                DUE TOMORROW!
              </div>

              {/* Pain Points */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Clock, text: "3-4 hours wasted", color: "text-red-400" },
                  { icon: HelpCircle, text: "Hidden exclusions", color: "text-yellow-400" },
                  { icon: X, text: "Inconsistent formats", color: "text-orange-400" },
                  { icon: AlertTriangle, text: "Costly mistakes", color: "text-red-400" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-slate-400">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* After View */}
          <div
            className={cn(
              "transition-all duration-500",
              activeView === "after"
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
            )}
          >
            <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-6 md:p-8 shadow-lg shadow-emerald-500/10">
              {/* Clean Interface Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Electrical Bid Comparison</h3>
                    <p className="text-xs text-slate-500">4 bids analyzed in 2 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Analysis Complete
                </div>
              </div>

              {/* Clean Comparison Table */}
              <div className="overflow-x-auto">
                <div className="min-w-[600px] text-sm">
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <div className="p-3 font-medium text-slate-400">Contractor</div>
                    <div className="p-3 font-medium text-slate-400">Base Bid</div>
                    <div className="p-3 font-medium text-slate-400">Exclusions</div>
                    <div className="p-3 font-medium text-slate-400">True Cost</div>
                    <div className="p-3 font-medium text-slate-400">Status</div>
                  </div>

                  {[
                    { name: "ABC Electric", base: "$245,000", excl: "$0", true: "$245,000", recommended: true },
                    { name: "PowerTech Inc", base: "$218,500", excl: "$42,000", true: "$260,500", recommended: false },
                    { name: "Volt Solutions", base: "$267,200", excl: "$0", true: "$267,200", recommended: false },
                    { name: "Spark Contractors", base: "$239,000", excl: "$28,500", true: "$267,500", recommended: false },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className={cn(
                        "grid grid-cols-5 gap-2 rounded-lg mb-2",
                        row.recommended ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-slate-800/50"
                      )}
                    >
                      <div className="p-3 text-white font-medium">{row.name}</div>
                      <div className="p-3 text-slate-300">{row.base}</div>
                      <div className={cn("p-3", row.excl !== "$0" ? "text-amber-400" : "text-slate-500")}>
                        {row.excl}
                      </div>
                      <div className="p-3 text-white font-semibold">{row.true}</div>
                      <div className="p-3">
                        {row.recommended ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Recommended
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Clock, text: "Done in 2 minutes", color: "text-emerald-400" },
                  { icon: CheckCircle2, text: "All exclusions found", color: "text-emerald-400" },
                  { icon: Sparkles, text: "AI recommendations", color: "text-blue-400" },
                  { icon: FileSpreadsheet, text: "Export to PDF", color: "text-indigo-400" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-slate-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-cycle indicator */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className={cn(
              "h-2 w-2 rounded-full transition-colors",
              activeView === "before" ? "bg-red-400" : "bg-slate-600"
            )} />
            <div className={cn(
              "h-2 w-2 rounded-full transition-colors",
              activeView === "after" ? "bg-emerald-400" : "bg-slate-600"
            )} />
          </div>
        </div>
      </div>
    </section>
  )
}
