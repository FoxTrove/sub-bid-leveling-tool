"use client"

import {
  AlertTriangle,
  BarChart3,
  Clock,
  FileText,
  Target,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Target,
    title: "Scope Gap Detection",
    description:
      "Instantly see which items are missing from each bid. Never miss an exclusion again.",
    accent: "primary",
  },
  {
    icon: AlertTriangle,
    title: "Exclusion Flagging",
    description:
      "AI identifies and highlights exclusions that could blow your budget later.",
    accent: "accent",
  },
  {
    icon: BarChart3,
    title: "True Price Comparison",
    description:
      "Compare bids on equal footing by accounting for what's actually included.",
    accent: "primary",
  },
  {
    icon: Zap,
    title: "AI Recommendations",
    description:
      "Get intelligent suggestions on which contractor to choose and why.",
    accent: "accent",
  },
  {
    icon: Clock,
    title: "Save Hours of Work",
    description:
      "What used to take 2-4 hours in spreadsheets now takes minutes.",
    accent: "primary",
  },
  {
    icon: FileText,
    title: "PDF Export",
    description:
      "Generate professional comparison reports to share with your team or clients.",
    accent: "accent",
  },
]

export function Features() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pattern-grid opacity-30" />

      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything You Need to{" "}
            <span className="text-gradient">Level Bids</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed for construction professionals who demand accuracy
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative border-2 border-border/50 bg-card/50 backdrop-blur-sm card-hover-lift border-accent-hover animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 rounded-lg gradient-card-hover opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardHeader className="relative">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  feature.accent === "primary"
                    ? "bg-primary/10 group-hover:bg-primary/20"
                    : "bg-accent/10 group-hover:bg-accent/20"
                } transition-colors`}>
                  <feature.icon className={`h-6 w-6 ${
                    feature.accent === "primary" ? "text-primary" : "text-accent"
                  }`} />
                </div>
                <CardTitle className="mt-4 text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
