"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Gift,
  Key,
  ArrowRight,
  DollarSign,
  Shield,
  HelpCircle,
  ChevronDown,
  XCircle,
  Loader2,
  Users,
  FileText,
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { INVITE_TOKENS, PRICING } from "@/lib/utils/constants"
import { trackInviteLinkViewed } from "@/lib/analytics"

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-40 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-green-50/50 dark:from-primary/10 dark:via-background dark:to-green-950/20">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your invitation...</p>
      </div>
    </div>
  )
}

function InvalidInvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950/20 dark:to-background">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
            <Image
              src="/bidvet-logo.png"
              alt="BidVet"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 animate-pulse">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold">Invalid Invite Link</h1>
          <p className="mb-8 text-muted-foreground text-lg">
            This invite link is invalid or has expired. If you received this link from someone,
            please ask them for a new one.
          </p>
          <div className="space-y-4">
            <Link href="/" className="block">
              <Button className="w-full" size="lg">
                Visit BidVet Home
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function JoinPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite")

  // Validate the invite token
  const promoCode = inviteToken ? INVITE_TOKENS[inviteToken] : null
  const isValidInvite = promoCode !== undefined && promoCode !== null

  // Store the promo code when page loads with valid invite
  useEffect(() => {
    if (isValidInvite && promoCode) {
      sessionStorage.setItem("bidvet_promo_code", promoCode)
      // Track invite link view
      trackInviteLinkViewed({
        invite_token: inviteToken || undefined,
        promo_code: promoCode,
      })
    }
  }, [isValidInvite, promoCode, inviteToken])

  const handleGetStarted = () => {
    if (promoCode) {
      router.push(`/login?code=${promoCode}`)
    }
  }

  // Show error page for invalid invites
  if (!isValidInvite) {
    return <InvalidInvitePage />
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
            <Image
              src="/bidvet-logo.png"
              alt="BidVet"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Already have an account? <span className="ml-1 text-primary font-medium">Sign in</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-primary/5 dark:from-green-950/30 dark:via-background dark:to-primary/10">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="mx-auto max-w-3xl text-center">
            {/* Partner Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/40 px-5 py-2.5 text-green-800 dark:text-green-300 shadow-sm border border-green-200 dark:border-green-800">
              <Gift className="h-5 w-5" />
              <span className="font-semibold">Partner Invitation</span>
              <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Compare Bids in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-primary">
                Minutes, Not Hours
              </span>
            </h1>

            <p className="mb-10 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AI-powered bid leveling for construction GCs. Upload your subcontractor bids, and get
              instant side-by-side comparisons with scope gap analysis.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-14 px-10 text-lg shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>No credit card required</span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>30 days free</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Your data stays private</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Results in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          {/* How It Works */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Three simple steps to better bid decisions</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-colors group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                <CardContent className="p-6 pt-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-2xl font-bold text-primary group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Create Account</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Just your email to get started. Set up your profile in under a minute.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-colors group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
                <CardContent className="p-6 pt-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Upload Bids</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Drop in 2-5 bid documents. We support PDF, Excel, and Word files.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 hover:border-primary/30 transition-colors group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
                <CardContent className="p-6 pt-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-2xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Get Results</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI compares scope items, identifies gaps, and recommends the best bid.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* The Deal Section */}
          <section className="mb-20">
            <Card className="border-2 border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50/50 to-white dark:from-green-950/20 dark:to-background overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                    <FileText className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Here's the Deal</h2>
                  <p className="text-muted-foreground">We believe in being upfront. No surprises.</p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
                      <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">First 30 Days: We Pay</h3>
                      <p className="text-muted-foreground">
                        Unlimited comparisons. We cover all AI costs. Zero charges to you.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
                      <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">After 30 Days: You Pay OpenAI</h3>
                      <p className="text-muted-foreground">
                        Add your own API key. Pay OpenAI directly (~$1-3 per comparison).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
                      <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">BidVet is Always Free</h3>
                      <p className="text-muted-foreground">
                        No subscription to us. No monthly fees. The tool is free forever.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Your Estimated Cost</h3>
                      <p className="text-muted-foreground">
                        10 comparisons/month ≈ $15-30. Pay as you go, no minimums.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Team Plan Section */}
          <section className="mb-20">
            <Card className="border-2 border-primary/20 dark:border-primary/30 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 px-8 py-6 border-b border-primary/10">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Need BidVet for Your Team?</h2>
                    <p className="text-muted-foreground text-sm">
                      Skip the API keys—just log in and use it
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-8">
                <div className="grid gap-6 sm:grid-cols-3 mb-8">
                  <div className="text-center p-5 rounded-xl bg-muted/50 border">
                    <div className="text-3xl font-bold text-primary mb-1">${PRICING.team.monthly}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                  <div className="text-center p-5 rounded-xl bg-muted/50 border">
                    <div className="text-3xl font-bold text-primary mb-1">10</div>
                    <div className="text-sm text-muted-foreground">team members</div>
                  </div>
                  <div className="text-center p-5 rounded-xl bg-muted/50 border">
                    <div className="text-3xl font-bold text-primary mb-1">Unlimited</div>
                    <div className="text-sm text-muted-foreground">comparisons</div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Start with your free 30-day trial. If your team finds it useful, upgrade anytime
                    from your dashboard.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center text-primary font-medium hover:underline"
                  >
                    Learn more about Team pricing
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ Section */}
          <section className="mb-20">
            <Card className="border-2">
              <CardContent className="p-8 md:p-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-4">
                    <HelpCircle className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">Common Questions</h2>
                </div>

                <div className="max-w-2xl mx-auto">
                  <FAQItem
                    question="Why is this free? What's the catch?"
                    answer="No catch. We're building BidVet for GCs and want real users to help us improve it. You get a free tool, we get feedback. After 30 days, you cover your own AI costs directly with OpenAI—we don't mark it up or take a cut."
                  />
                  <FAQItem
                    question="What's an OpenAI API key and is it hard to set up?"
                    answer="It's like a password that lets BidVet use OpenAI's AI on your behalf. Getting one takes 2 minutes: create an OpenAI account, go to their API section, and generate a key. We'll walk you through it when the time comes."
                  />
                  <FAQItem
                    question="How much will OpenAI actually cost me?"
                    answer="Each bid comparison typically costs $1-3 depending on document size. If you run 10 comparisons a month, expect $15-30. You only pay for what you use—no minimums, no subscriptions."
                  />
                  <FAQItem
                    question="What happens if I don't add my API key after 30 days?"
                    answer="You won't be charged anything. You just won't be able to run new comparisons until you add a key. All your existing projects and results remain accessible forever."
                  />
                  <FAQItem
                    question="Can I cancel anytime?"
                    answer="There's nothing to cancel. No subscription, no commitment. Stop using it whenever you want. If you ever add an OpenAI key, you can delete it anytime from your settings."
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Final CTA */}
          <section className="mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-10 md:p-12 text-center text-white shadow-xl shadow-green-500/25">
              <h2 className="mb-3 text-2xl md:text-3xl font-bold">Ready to Level Your Bids?</h2>
              <p className="mb-8 text-green-100 text-lg">
                30 days free. Then ~$1-3 per comparison. No subscription ever.
              </p>
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-14 px-10 text-lg bg-white text-green-600 hover:bg-green-50 shadow-lg"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/bidvet-logo.png"
              alt="BidVet"
              width={100}
              height={28}
              className="h-6 w-auto opacity-70"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at{" "}
            <a
              href="mailto:support@foxtrove.ai"
              className="text-primary font-medium hover:underline"
            >
              support@foxtrove.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <JoinPageContent />
    </Suspense>
  )
}
