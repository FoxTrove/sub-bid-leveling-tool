"use client"

import {
  AlertTriangle,
  BarChart3,
  Clock,
  FileText,
  Target,
  Zap,
  Link2,
  Sparkles,
  Shield,
} from "lucide-react"

const features = [
  {
    icon: Link2,
    title: "Procore Integration",
    description:
      "Import projects and bids directly from Procore. No more manual file downloads and uploads.",
    color: "violet",
    badge: "Exclusive",
  },
  {
    icon: Sparkles,
    title: "Fully Automated Normalization",
    description:
      "AI normalizes bids automatically—no manual adjustments needed. Other tools require you to do this yourself.",
    color: "blue",
    badge: "Key Differentiator",
  },
  {
    icon: Zap,
    title: "AI Recommendations",
    description:
      "Get intelligent contractor recommendations with confidence scores explaining why, not just raw data.",
    color: "emerald",
  },
  {
    icon: Target,
    title: "Scope Gap Detection",
    description:
      "Instantly see which items are missing from each bid. Never miss an exclusion again.",
    color: "amber",
  },
  {
    icon: BarChart3,
    title: "Multi-Format Support",
    description:
      "Upload PDFs, Excel spreadsheets, and Word documents. Compare bids regardless of format.",
    color: "indigo",
  },
  {
    icon: Shield,
    title: "Confidence Scoring",
    description:
      "Every extracted item includes a confidence score so you know what needs manual review.",
    color: "blue",
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
}

export function Features() {
  return (
    <section className="relative py-24 overflow-hidden bg-slate-950">
      {/* Gradient accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[128px] -translate-x-1/2 translate-y-1/2" />

      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-400 mb-4">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Level Bids</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Powerful features designed for construction professionals who demand accuracy
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const colors = colorMap[feature.color]
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl bg-slate-900/50 border border-slate-800 p-6 hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50"
              >
                {"badge" in feature && feature.badge && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-full shadow-lg">
                    {feature.badge}
                  </div>
                )}
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} border ${colors.border} transition-colors`}>
                  <feature.icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
