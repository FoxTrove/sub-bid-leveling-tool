import { Upload, Cpu, FileCheck } from "lucide-react"

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
    <section className="border-t bg-muted/30 py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to level your subcontractor bids
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <step.icon className="h-8 w-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
