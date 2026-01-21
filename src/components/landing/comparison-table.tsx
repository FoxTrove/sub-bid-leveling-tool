"use client"

import { Check, X, Minus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const features = [
  {
    name: "Procore integration",
    bidvet: true,
    otherAI: false,
    manual: false,
    highlight: true,
  },
  {
    name: "Fully automated normalization",
    bidvet: true,
    otherAI: "Semi-manual",
    manual: false,
    highlight: true,
  },
  {
    name: "AI recommendations with reasoning",
    bidvet: true,
    otherAI: false,
    manual: false,
    highlight: true,
  },
  {
    name: "Confidence scores",
    bidvet: true,
    otherAI: false,
    manual: false,
  },
  {
    name: "Time to compare 4 bids",
    bidvet: "~2 minutes",
    otherAI: "5-10 min + review",
    manual: "3-4 hours",
  },
  {
    name: "Automatic scope extraction",
    bidvet: true,
    otherAI: true,
    manual: false,
  },
  {
    name: "Scope gap detection",
    bidvet: true,
    otherAI: true,
    manual: "Maybe",
  },
  {
    name: "PDF/Word/Excel support",
    bidvet: true,
    otherAI: "PDF only",
    manual: true,
  },
  {
    name: "Team collaboration",
    bidvet: true,
    otherAI: false,
    manual: false,
  },
  {
    name: "Professional PDF export",
    bidvet: true,
    otherAI: "Excel only",
    manual: false,
  },
  {
    name: "Cost per comparison",
    bidvet: "~$6",
    otherAI: "Beta/Unknown",
    manual: "$150-300*",
    note: "*Based on labor cost",
  },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
      </div>
    )
  }

  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <X className="h-4 w-4 text-red-400" />
        </div>
      </div>
    )
  }

  if (value === "Maybe" || value === "Varies" || value === "Basic" || value === "Over time" || value === "Semi-manual" || value === "PDF only" || value === "Excel only" || value === "5-10 min + review" || value === "Beta/Unknown") {
    return (
      <div className="flex justify-center">
        <span className="text-sm text-amber-400">{value}</span>
      </div>
    )
  }

  if (value === "Coming soon") {
    return (
      <div className="flex justify-center">
        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">{value}</span>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <span className="text-sm font-medium text-slate-300">{value}</span>
    </div>
  )
}

export function ComparisonTable() {
  return (
    <section className="py-24 bg-slate-950 overflow-hidden">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 text-sm font-medium text-violet-400 mb-4">
            <Sparkles className="h-4 w-4" />
            Compare Options
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
            BidVet vs. The Alternatives
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            See how BidVet compares to other AI tools and manual methods
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 font-medium text-slate-400">Feature</th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-2">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-bold text-blue-400">BidVet</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mb-2 text-2xl">
                        🤖
                      </div>
                      <span className="font-medium text-slate-400">Other AI Tools</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mb-2 text-2xl">
                        📊
                      </div>
                      <span className="font-medium text-slate-400">Spreadsheets</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={cn(
                      "border-t border-slate-800",
                      "highlight" in feature && feature.highlight
                        ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                        : index % 2 === 0 ? "bg-slate-900/50" : ""
                    )}
                  >
                    <td className="p-4">
                      <span className={cn(
                        "font-medium",
                        "highlight" in feature && feature.highlight ? "text-blue-300" : "text-white"
                      )}>
                        {feature.name}
                        {"highlight" in feature && feature.highlight && (
                          <span className="ml-2 text-xs text-blue-400">★</span>
                        )}
                      </span>
                      {"note" in feature && feature.note && (
                        <span className="block text-xs text-slate-500 mt-1">
                          {feature.note}
                        </span>
                      )}
                    </td>
                    <td className="p-4 bg-blue-500/5">
                      <FeatureValue value={feature.bidvet} />
                    </td>
                    <td className="p-4">
                      <FeatureValue value={feature.otherAI} />
                    </td>
                    <td className="p-4">
                      <FeatureValue value={feature.manual} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">
              Ready to save hours on every bid comparison?
            </p>
            <div className="inline-flex items-center gap-2 text-sm">
              <span className="text-slate-400">Start with</span>
              <span className="font-bold text-blue-400">5 free comparisons</span>
              <span className="text-slate-400">— no credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
