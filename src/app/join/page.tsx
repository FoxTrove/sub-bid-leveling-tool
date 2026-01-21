"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Gift, Key, ArrowRight, DollarSign, Shield, HelpCircle, ChevronDown, XCircle, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { INVITE_TOKENS, PRICING } from "@/lib/utils/constants"
import { trackInviteLinkViewed } from "@/lib/analytics"

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function InvalidInvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950/20 dark:to-background">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/bidvet-logo.png"
              alt="BidVet"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="mb-4 text-2xl font-bold">Invalid Invite Link</h1>
          <p className="mb-8 text-muted-foreground">
            This invite link is invalid or has expired. If you received this link from someone, please ask them for a new one.
          </p>
          <div className="space-y-3">
            <Link href="/">
              <Button variant="outline" className="w-full">
                Visit BidVet Home
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline">
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/bidvet-logo.png"
              alt="BidVet"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <Gift className="h-5 w-5" />
            <span className="font-semibold">Partner Invitation</span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Use BidVet{" "}
            <span className="text-primary">Free Forever</span>
          </h1>

          <p className="mb-8 text-xl text-muted-foreground">
            AI-powered bid leveling for construction GCs.
            No credit card. No subscription. Just results.
          </p>

          {/* CTA */}
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="mb-12 h-14 px-8 text-lg"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* The Deal - Be Transparent */}
          <Card className="mb-12 border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-8">
              <h2 className="mb-2 text-2xl font-bold">Here's the Deal</h2>
              <p className="mb-6 text-muted-foreground">We believe in being upfront. No surprises.</p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                    <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">First 30 Days: We Pay</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlimited comparisons. We cover all AI costs. Zero charges to you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                    <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">After 30 Days: You Pay OpenAI</h3>
                    <p className="text-sm text-muted-foreground">
                      Add your own OpenAI API key. You pay OpenAI directly (~$1-3 per comparison).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">BidVet is Always Free</h3>
                    <p className="text-sm text-muted-foreground">
                      No subscription to us. No monthly fees. The tool is free—you just cover AI costs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Your Estimated Cost</h3>
                    <p className="text-sm text-muted-foreground">
                      10 comparisons/month ≈ $15-30. Pay as you go, no minimums.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Option */}
          <Card className="mb-12 border-2 border-primary/30 dark:border-primary/50">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Want BidVet for Your Team?</h2>
              </div>

              <p className="mb-6 text-muted-foreground max-w-xl mx-auto">
                If multiple estimators will use BidVet, consider our Team plan.
                No API keys to manage—your team just logs in and uses it.
              </p>

              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">${PRICING.team.monthly}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">10</div>
                  <div className="text-sm text-muted-foreground">team members</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">∞</div>
                  <div className="text-sm text-muted-foreground">comparisons</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Start with your free 30 days first. If your team finds it useful,
                you can upgrade anytime from your dashboard.
              </p>

              <Link href="/pricing" className="text-primary hover:underline text-sm font-medium">
                Learn more about Team pricing →
              </Link>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">How It Works</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  1
                </div>
                <h3 className="mb-2 font-semibold">Sign Up</h3>
                <p className="text-sm text-muted-foreground">
                  Just your email. No credit card required.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  2
                </div>
                <h3 className="mb-2 font-semibold">Upload Bids</h3>
                <p className="text-sm text-muted-foreground">
                  Drop in PDF, Excel, or Word bid documents
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  3
                </div>
                <h3 className="mb-2 font-semibold">Get Results</h3>
                <p className="text-sm text-muted-foreground">
                  AI analyzes and recommends the best bid
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <Card className="mb-12">
            <CardContent className="p-8">
              <div className="mb-6 flex items-center justify-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Common Questions</h2>
              </div>

              <div className="text-left">
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

          {/* Final CTA */}
          <div className="rounded-xl bg-green-100 p-8 dark:bg-green-900/30">
            <h2 className="mb-2 text-xl font-bold text-green-800 dark:text-green-300">
              Ready to level your bids?
            </h2>
            <p className="mb-4 text-green-700 dark:text-green-400">
              30 days free. Then ~$1-3 per comparison. No subscription ever.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Questions? Contact us at{" "}
            <a href="mailto:support@foxtrove.ai" className="text-primary hover:underline">
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
