"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, X, Zap, Users, Building2, ArrowRight, Coins, Sparkles, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
    <div className="min-h-screen bg-slate-950">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[128px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[128px] translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[128px] translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/bidvet-logo-light.png"
              alt="BidVet"
              width={140}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container relative py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-400 mb-6">
          <Coins className="h-4 w-4" />
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 text-white">
          Choose how you want to{" "}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">pay</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4">
          Two simple options—pick what works best for your workflow.
        </p>
        <p className="text-lg font-medium">
          <span className="text-blue-400">Start with 5 free comparisons.</span>{" "}
          <span className="text-slate-500">No credit card required.</span>
        </p>
      </section>

      {/* Side-by-side Options Overview */}
      <section className="container relative pb-16">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Credit Packs Option */}
          <div className="relative rounded-2xl bg-slate-900/50 border-2 border-amber-500/30 p-6 overflow-hidden hover:border-amber-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Credit Packs</h3>
                  <p className="text-sm text-slate-400">Pay as you go</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4">
                Buy credits upfront, use them whenever. Perfect for occasional or seasonal use.
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white">From $100</span>
              </div>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Credits never expire
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  No monthly commitment
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Buy more anytime
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50"
                onClick={() => document.getElementById('credit-packs')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Credit Packs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Subscription Option */}
          <div className="relative rounded-2xl bg-slate-900/50 border-2 border-blue-500/30 p-6 overflow-hidden hover:border-blue-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute -top-1 right-4">
              <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg">
                Best Value
              </span>
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Unlimited Subscription</h3>
                  <p className="text-sm text-slate-400">Best for regular users</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4">
                Flat monthly rate for unlimited comparisons. Best value for 10+ comparisons/month.
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white">$79</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Unlimited comparisons
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Priority support
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Cancel anytime
                </li>
              </ul>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                onClick={() => document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Subscriptions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Credit Packs Section */}
      <section id="credit-packs" className="container relative pb-20 scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-sm font-medium text-amber-400 mb-4">
            <Coins className="h-4 w-4" />
            Pay As You Go
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">Credit Packs</h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
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

        <p className="text-center text-xs text-slate-500 mt-6 max-w-lg mx-auto">
          *Comparison estimates are based on typical document sizes. Actual usage may vary depending on the length and complexity of your bid documents.
        </p>
      </section>

      {/* Comparison Helper */}
      <section className="border-t border-b border-slate-800 bg-slate-900/50 py-16 relative">
        <div className="container relative">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-400 mb-4">
                <Calculator className="h-4 w-4" />
                Which option is right for you?
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Credits vs. Subscription</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-2xl bg-slate-900/80 border-2 border-amber-500/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Coins className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Credit Packs</h3>
                    <p className="text-sm text-slate-400">Best for occasional users</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Fewer than 10-12 comparisons per month</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Unpredictable or seasonal workload</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>No commitment—buy only when needed</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Credits never expire</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border-2 border-blue-500/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Unlimited Subscription</h3>
                    <p className="text-sm text-slate-400">Best for regular users</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>12+ comparisons per month (break-even point)</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Consistent, predictable workflow</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Never worry about running out</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Priority support included</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-sm text-slate-400">
                <span className="font-medium text-white">Rule of thumb:</span>{" "}
                If you run 10+ comparisons per month consistently, a subscription offers better value.
                For occasional or seasonal use, credit packs give you flexibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section id="subscriptions" className="container relative py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-400 mb-4">
            <Sparkles className="h-4 w-4" />
            Unlimited Plans
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">Go Unlimited</h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
            For teams and heavy users. Unlimited comparisons, priority support, and more.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <Label htmlFor="billing-toggle" className={cn(!isAnnual && "text-white", isAnnual && "text-slate-500")}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="billing-toggle" className={cn(isAnnual && "text-white", !isAnnual && "text-slate-500")}>
              Annual
            </Label>
            {isAnnual && (
              <span className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Save 2 months
              </span>
            )}
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {subscriptionPlans.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
            const Icon = plan.icon

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl bg-slate-900/50 border-2 p-6 transition-all",
                  plan.popular
                    ? "border-blue-500/50 shadow-lg shadow-blue-500/10 scale-105 z-10"
                    : plan.highlight
                    ? "border-violet-500/50 shadow-lg shadow-violet-500/10"
                    : "border-slate-800 hover:border-slate-700"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                {plan.highlight && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full shadow-lg">
                      Best for Teams
                    </span>
                  </div>
                )}

                <div className="text-center pb-2 pt-4">
                  <div className={cn(
                    "mx-auto mb-3 h-14 w-14 rounded-2xl flex items-center justify-center border",
                    plan.popular
                      ? "bg-blue-500/10 border-blue-500/20"
                      : plan.highlight
                      ? "bg-violet-500/10 border-violet-500/20"
                      : "bg-slate-800 border-slate-700"
                  )}>
                    <Icon className={cn(
                      "h-7 w-7",
                      plan.popular ? "text-blue-400" : plan.highlight ? "text-violet-400" : "text-slate-400"
                    )} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">{plan.description}</p>
                </div>

                <div className="flex-1 pt-4">
                  <div className="text-center mb-6">
                    {price !== null ? (
                      <>
                        <span className="text-4xl font-bold text-white">${isAnnual ? Math.round(price / 12) : price}</span>
                        <span className="text-slate-400">/month</span>
                        {isAnnual && price > 0 && (
                          <p className="text-sm text-slate-500 mt-1">
                            ${price} billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-white">Custom</span>
                    )}
                  </div>

                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-slate-600 shrink-0" />
                        )}
                        <span className={cn(feature.included ? "text-slate-300" : "text-slate-600")}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href={plan.ctaLink || `/login?plan=${plan.planKey}&interval=${isAnnual ? "annual" : "monthly"}`}
                    className="w-full"
                  >
                    <Button
                      className={cn(
                        "w-full",
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                          : plan.highlight
                          ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      )}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container relative py-16 border-t border-slate-800">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto grid gap-6">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="font-semibold text-white mb-2">What counts as a comparison?</h3>
            <p className="text-slate-400 text-sm">
              Each time you upload and analyze a set of bids for a project counts as one comparison.
              You can include 2-5 subcontractor bids per comparison.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="font-semibold text-white mb-2">Do credits expire?</h3>
            <p className="text-slate-400 text-sm">
              No! Your credit balance never expires. Use them at your own pace.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="font-semibold text-white mb-2">Can I mix credits and subscription?</h3>
            <p className="text-slate-400 text-sm">
              Subscribers have unlimited comparisons, so credits aren&apos;t needed.
              If you cancel your subscription, any remaining credits will still be available.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="font-semibold text-white mb-2">What happens to my 5 free comparisons?</h3>
            <p className="text-slate-400 text-sm">
              Free comparisons are used first before your purchased credits.
              Once you&apos;ve used your free comparisons, credits will be deducted.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="font-semibold text-white mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-slate-400 text-sm">
              Yes, you can cancel at any time. You&apos;ll continue to have unlimited access
              until the end of your billing period.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="font-semibold text-white mb-2">Do you offer refunds?</h3>
            <p className="text-slate-400 text-sm">
              We offer a 14-day money-back guarantee on subscriptions. Credit pack purchases
              are non-refundable but never expire.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-violet-600/20" />
        <div className="absolute inset-0 bg-slate-950/50" />

        <div className="container relative py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to level your bids?</h2>
            <p className="text-slate-400 mb-8">
              Start with 5 free comparisons. No credit card required.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/25">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-slate-950">
        <div className="container text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Foxtrove.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
