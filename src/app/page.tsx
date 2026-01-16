import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Hero } from "@/components/landing/hero"
import { ProblemSection } from "@/components/landing/problem-section"
import { DemoSection } from "@/components/landing/demo-section"
import { Features } from "@/components/landing/features"
import { ROICalculator } from "@/components/landing/roi-calculator"
import { ComparisonTable } from "@/components/landing/comparison-table"
import { FAQSection } from "@/components/landing/faq-section"
import { CTA } from "@/components/landing/cta"
import { FloatingCTA } from "@/components/landing/floating-cta"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <ProblemSection />
        <DemoSection />
        <Features />
        <ROICalculator />
        <ComparisonTable />
        <FAQSection />
        <CTA />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  )
}
