"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X, Zap, Users, Building2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    description: "Try BidLevel risk-free",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Zap,
    features: [
      { text: "5 bid comparisons", included: true },
      { text: "PDF & CSV exports", included: true },
      { text: "AI-powered analysis", included: true },
      { text: "Scope gap detection", included: true },
      { text: "Unlimited comparisons", included: false },
      { text: "Branded reports", included: false },
      { text: "Team collaboration", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Get Started Free",
    ctaLink: "/login",
    popular: false,
  },
  {
    name: "Pro",
    description: "For busy estimators",
    monthlyPrice: 79,
    annualPrice: 790,
    icon: Zap,
    features: [
      { text: "Unlimited comparisons", included: true },
      { text: "PDF & CSV exports", included: true },
      { text: "AI-powered analysis", included: true },
      { text: "Scope gap detection", included: true },
      { text: "Priority processing", included: true },
      { text: "Email support", included: true },
      { text: "Branded reports", included: false },
      { text: "Team collaboration", included: false },
    ],
    cta: "Start Pro",
    ctaLink: "/login?plan=pro",
    popular: true,
  },
  {
    name: "Team",
    description: "For growing companies",
    monthlyPrice: 199,
    annualPrice: 1990,
    icon: Users,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 10 team members", included: true },
      { text: "Branded PDF reports", included: true },
      { text: "Team collaboration", included: true },
      { text: "Priority support", included: true },
      { text: "Usage analytics", included: true },
      { text: "Custom integrations", included: false },
      { text: "Dedicated account manager", included: false },
    ],
    cta: "Start Team",
    ctaLink: "/login?plan=team",
    popular: false,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: null,
    annualPrice: null,
    icon: Building2,
    features: [
      { text: "Everything in Team", included: true },
      { text: "Unlimited team members", included: true },
      { text: "White-label solution", included: true },
      { text: "SSO / SAML", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA guarantees", included: true },
      { text: "On-premise option", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:sales@foxtrove.ai?subject=BidLevel Enterprise Inquiry",
    popular: false,
  },
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="font-semibold text-xl">BidLevel</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 text-center">
        <Badge variant="outline" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Start free with 5 comparisons. Upgrade when you need unlimited access.
          <br />
          <span className="text-primary font-medium">One good bid decision pays for itself.</span>
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <Label htmlFor="billing-toggle" className={cn(!isAnnual && "text-foreground", isAnnual && "text-muted-foreground")}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-toggle" className={cn(isAnnual && "text-foreground", !isAnnual && "text-muted-foreground")}>
            Annual
          </Label>
          {isAnnual && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Save 2 months
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
            const Icon = plan.icon

            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col",
                  plan.popular && "border-primary shadow-lg scale-105 z-10"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    {price !== null ? (
                      <>
                        <span className="text-4xl font-bold">${isAnnual ? Math.round(price / 12) : price}</span>
                        <span className="text-muted-foreground">/month</span>
                        {isAnnual && price > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            ${price} billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-2xl font-bold">Custom</span>
                    )}
                  </div>

                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={cn(!feature.included && "text-muted-foreground/70")}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link href={plan.ctaLink} className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-16 border-t">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto grid gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold">What counts as a comparison?</h3>
            <p className="text-muted-foreground">
              Each time you upload and analyze a set of bids for a project counts as one comparison.
              You can include 2-5 subcontractor bids per comparison.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Can I use my own OpenAI API key?</h3>
            <p className="text-muted-foreground">
              Yes! Free users can bring their own API key for unlimited comparisons.
              Paid plans include all API costs so you don&apos;t have to manage keys.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">What happens when I hit my free limit?</h3>
            <p className="text-muted-foreground">
              You can either upgrade to a paid plan or add your own OpenAI API key to continue
              using BidLevel for free.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Can I cancel anytime?</h3>
            <p className="text-muted-foreground">
              Yes, you can cancel your subscription at any time. You&apos;ll continue to have access
              until the end of your billing period.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Do you offer refunds?</h3>
            <p className="text-muted-foreground">
              We offer a 14-day money-back guarantee. If you&apos;re not satisfied, contact us for a full refund.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to level your bids?</h2>
          <p className="text-muted-foreground mb-6">
            Join hundreds of GCs who save hours on every bid comparison.
          </p>
          <Link href="/login">
            <Button size="lg">
              Start Free - No Credit Card Required
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Foxtrove.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
