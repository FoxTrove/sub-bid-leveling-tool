"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, X, Zap, Users, Building2, ArrowRight, Coins, Scale, Sparkles, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CREDIT_PACKS } from "@/lib/utils/constants"
import { CreditPackCard } from "@/components/pricing/credit-pack-card"
import { toast } from "sonner"
import { trackPricingPageViewed } from "@/lib/analytics"

const subscriptionPlans = [
  {
    name: "Pro",
    description: "For busy estimators",
    monthlyPrice: 79,
    annualPrice: 790,
    icon: Zap,
    planKey: "pro",
    features: [
      { text: "Unlimited comparisons", included: true },
      { text: "PDF & CSV exports", included: true },
      { text: "AI-powered analysis", included: true },
      { text: "Scope gap detection", included: true },
      { text: "Priority processing", included: true },
      { text: "Email support", included: true },
    ],
    cta: "Start Pro",
    popular: true,
  },
  {
    name: "Team",
    description: "For growing companies",
    monthlyPrice: 399,
    annualPrice: 3990,
    icon: Users,
    planKey: "team",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 10 team members", included: true },
      { text: "Branded PDF reports", included: true },
      { text: "Team collaboration", included: true },
      { text: "Priority support", included: true },
      { text: "Usage analytics", included: true },
    ],
    cta: "Start Team",
    popular: false,
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: null,
    annualPrice: null,
    icon: Building2,
    planKey: "enterprise",
    features: [
      { text: "Everything in Team", included: true },
      { text: "Unlimited team members", included: true },
      { text: "White-label solution", included: true },
      { text: "SSO / SAML", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated account manager", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:sales@foxtrove.ai?subject=BidVet Enterprise Inquiry",
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [isAnnual, setIsAnnual] = useState(true)
  const [loadingPack, setLoadingPack] = useState<string | null>(null)

  // Track pricing page view
  useEffect(() => {
    trackPricingPageViewed()
  }, [])

  const handlePurchasePack = async (packKey: string) => {
    setLoadingPack(packKey)
    try {
      const response = await fetch("/api/stripe/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packKey }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          // User not logged in, redirect to login first
          sessionStorage.setItem("bidvet_purchase_pack", packKey)
          router.push("/login")
          return
        }
        throw new Error(data.error || "Failed to create checkout session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout")
    } finally {
      setLoadingPack(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <Scale className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-gradient">BidVet</span>
              <span className="text-[10px] text-muted-foreground">by Foxtrove.ai</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="shadow-lg shadow-primary/20">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 text-center">
        <Badge variant="outline" className="mb-4 bg-accent/10 text-accent border-accent/30">
          <Coins className="mr-1 h-3 w-3" />
          Pricing
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          Choose how you want to pay
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
          Two simple options—pick what works best for your workflow.
        </p>
        <p className="text-lg text-primary font-medium">
          Start with 5 free comparisons. No credit card required.
        </p>
      </section>

      {/* Side-by-side Options Overview */}
      <section className="container pb-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Credit Packs Option */}
          <Card className="border-2 border-accent/30 bg-accent/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">Credit Packs</CardTitle>
                  <CardDescription>Pay as you go</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Buy credits upfront, use them whenever. Perfect for occasional or seasonal use.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">From $100</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Credits never expire
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  No monthly commitment
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Buy more anytime
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => document.getElementById('credit-packs')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Credit Packs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {/* Subscription Option */}
          <Card className="border-2 border-primary/30 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Unlimited Subscription</CardTitle>
                  <CardDescription>Best for regular users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Flat monthly rate for unlimited comparisons. Best value for 10+ comparisons/month.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$79</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Unlimited comparisons
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Subscriptions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Credit Packs Section */}
      <section id="credit-packs" className="container pb-20 scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
            <Coins className="h-4 w-4" />
            Pay As You Go
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">Credit Packs</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Perfect for occasional use. Buy once, use anytime. Credits never expire.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <CreditPackCard
            name={CREDIT_PACKS.starter.name}
            price={CREDIT_PACKS.starter.price}
            estimatedComparisons={CREDIT_PACKS.starter.estimatedComparisons}
            onPurchase={() => handlePurchasePack("starter")}
            isLoading={loadingPack === "starter"}
          />
          <CreditPackCard
            name={CREDIT_PACKS.professional.name}
            price={CREDIT_PACKS.professional.price}
            estimatedComparisons={CREDIT_PACKS.professional.estimatedComparisons}
            bonus={CREDIT_PACKS.professional.bonus}
            isPopular
            onPurchase={() => handlePurchasePack("professional")}
            isLoading={loadingPack === "professional"}
          />
          <CreditPackCard
            name={CREDIT_PACKS.enterprise.name}
            price={CREDIT_PACKS.enterprise.price}
            estimatedComparisons={CREDIT_PACKS.enterprise.estimatedComparisons}
            bonus={CREDIT_PACKS.enterprise.bonus}
            onPurchase={() => handlePurchasePack("enterprise")}
            isLoading={loadingPack === "enterprise"}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-lg mx-auto">
          *Comparison estimates are based on typical document sizes. Actual usage may vary depending on the length and complexity of your bid documents.
        </p>
      </section>

      {/* Comparison Helper */}
      <section className="border-t border-b bg-secondary/30 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Calculator className="h-4 w-4" />
                Which option is right for you?
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Credits vs. Subscription</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 border-accent/30 bg-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Credit Packs</CardTitle>
                      <CardDescription>Best for occasional users</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Fewer than 10-12 comparisons per month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Unpredictable or seasonal workload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>No commitment—buy only when needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Credits never expire</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Unlimited Subscription</CardTitle>
                      <CardDescription>Best for regular users</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>12+ comparisons per month (break-even point)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Consistent, predictable workflow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Never worry about running out</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>Priority support included</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-muted/50 border text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Rule of thumb:</span>{" "}
                If you run 10+ comparisons per month consistently, a subscription offers better value.
                For occasional or seasonal use, credit packs give you flexibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="subscriptions" className="container py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            Unlimited Plans
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">Go Unlimited</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            For teams and heavy users. Unlimited comparisons, priority support, and more.
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
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                Save 2 months
              </Badge>
            )}
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {subscriptionPlans.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
            const Icon = plan.icon

            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col border-2 transition-all",
                  plan.popular
                    ? "border-primary shadow-lg shadow-primary/10 scale-105 z-10"
                    : plan.highlight
                    ? "border-accent shadow-lg shadow-accent/10"
                    : "border-border/50 hover:border-primary/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary shadow-lg">Most Popular</Badge>
                  </div>
                )}
                {plan.highlight && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent shadow-lg">Best for Teams</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-6">
                  <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-primary" />
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
                  <Link
                    href={plan.ctaLink || `/login?plan=${plan.planKey}&interval=${isAnnual ? "annual" : "monthly"}`}
                    className="w-full"
                  >
                    <Button
                      className={cn(
                        "w-full",
                        plan.popular && "shadow-lg shadow-primary/20",
                        plan.highlight && !plan.popular && "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20"
                      )}
                      variant={plan.popular ? "default" : plan.highlight ? "default" : "outline"}
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
            <h3 className="font-semibold">Do credits expire?</h3>
            <p className="text-muted-foreground">
              No! Your credit balance never expires. Use them at your own pace.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Can I mix credits and subscription?</h3>
            <p className="text-muted-foreground">
              Subscribers have unlimited comparisons, so credits aren&apos;t needed.
              If you cancel your subscription, any remaining credits will still be available.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">What happens to my 5 free comparisons?</h3>
            <p className="text-muted-foreground">
              Free comparisons are used first before your purchased credits.
              Once you&apos;ve used your free comparisons, credits will be deducted.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Can I cancel my subscription anytime?</h3>
            <p className="text-muted-foreground">
              Yes, you can cancel at any time. You&apos;ll continue to have unlimited access
              until the end of your billing period.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Do you offer refunds?</h3>
            <p className="text-muted-foreground">
              We offer a 14-day money-back guarantee on subscriptions. Credit pack purchases
              are non-refundable but never expire.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t overflow-hidden">
        <div className="absolute inset-0 gradient-cta" />
        <div className="absolute inset-0 pattern-grid opacity-10" />

        <div className="container relative py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to level your bids?</h2>
            <p className="text-white/80 mb-8">
              Start with 5 free comparisons. No credit card required.
            </p>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="shadow-xl">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Foxtrove.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
