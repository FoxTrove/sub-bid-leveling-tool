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
  },
  {
    icon: AlertTriangle,
    title: "Exclusion Flagging",
    description:
      "AI identifies and highlights exclusions that could blow your budget later.",
  },
  {
    icon: BarChart3,
    title: "True Price Comparison",
    description:
      "Compare bids on equal footing by accounting for what's actually included.",
  },
  {
    icon: Zap,
    title: "AI Recommendations",
    description:
      "Get intelligent suggestions on which contractor to choose and why.",
  },
  {
    icon: Clock,
    title: "Save Hours of Work",
    description:
      "What used to take 2-4 hours in spreadsheets now takes minutes.",
  },
  {
    icon: FileText,
    title: "PDF Export",
    description:
      "Generate professional comparison reports to share with your team or clients.",
  },
]

export function Features() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Everything You Need to Level Bids
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features designed for construction professionals
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-2">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
