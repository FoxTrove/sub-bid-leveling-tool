"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCard, Loader2, Sparkles, Key, Coins, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { FREE_COMPARISON_LIMIT } from "@/lib/utils/constants"
import { getPlanDisplayName, getPlanBadgeColor } from "@/lib/utils/subscription"
import type { PlanType, BillingCycle } from "@/types"

interface BillingSectionProps {
  plan: PlanType
  subscriptionStatus: string | null
  subscriptionPeriodEnd: string | null
  billingCycle: BillingCycle | null
  comparisonsUsed: number
  creditBalance: number
  hasApiKey: boolean
  stripeCustomerId: string | null
}

export function BillingSection({
  plan,
  subscriptionStatus,
  subscriptionPeriodEnd,
  billingCycle,
  comparisonsUsed,
  creditBalance,
  hasApiKey,
  stripeCustomerId,
}: BillingSectionProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleManageBilling = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal")
      }

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal")
      setIsLoading(false)
    }
  }

  const isActive = subscriptionStatus === "active"
  const isPaidPlan = plan !== "free" && isActive

  // Calculate remaining free comparisons
  const freeRemaining = Math.max(FREE_COMPARISON_LIMIT - comparisonsUsed, 0)

  // Calculate usage for progress bar
  const usagePercent = hasApiKey || isPaidPlan
    ? 0
    : Math.min((comparisonsUsed / FREE_COMPARISON_LIMIT) * 100, 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Billing & Plan</CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </div>
          {hasApiKey ? (
            <Badge variant="outline" className="gap-1">
              <Key className="h-3 w-3" />
              BYOK Active
            </Badge>
          ) : isPaidPlan ? (
            <Badge className={getPlanBadgeColor(plan)}>
              <Sparkles className="mr-1 h-3 w-3" />
              {getPlanDisplayName(plan)}
            </Badge>
          ) : creditBalance > 0 ? (
            <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/20">
              <Coins className="h-3 w-3" />
              {creditBalance} credits
            </Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit Balance - Prominent for credit-based users */}
        {!hasApiKey && !isPaidPlan && (
          <div className="rounded-xl border-2 border-accent/20 bg-accent/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Coins className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Balance</p>
                  <p className="text-2xl font-bold text-accent">
                    {creditBalance} {creditBalance === 1 ? 'credit' : 'credits'}
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="border-accent/30 text-accent hover:bg-accent/10">
                  Buy More
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            {freeRemaining > 0 && (
              <p className="text-xs text-muted-foreground">
                Plus {freeRemaining} free comparison{freeRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        )}

        {/* Usage Stats for Free Tier */}
        {!hasApiKey && !isPaidPlan && creditBalance === 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Free Comparisons</span>
              <span className="font-medium">
                {comparisonsUsed} / {FREE_COMPARISON_LIMIT} used
              </span>
            </div>
            <div className="space-y-1">
              <Progress value={usagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {freeRemaining > 0
                  ? `${freeRemaining} comparison${freeRemaining !== 1 ? 's' : ''} remaining`
                  : "No free comparisons remaining"
                }
              </p>
            </div>
          </div>
        )}

        {/* Subscription Status for Paid Plans */}
        {isPaidPlan && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{getPlanDisplayName(plan)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comparisons</span>
              <span className="font-medium text-primary">Unlimited</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Billing cycle</span>
              <span className="font-medium capitalize">{billingCycle || "Monthly"}</span>
            </div>
            {subscriptionPeriodEnd && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next billing date</span>
                <span className="font-medium">
                  {new Date(subscriptionPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-green-600 border-green-200 dark:text-green-400 dark:border-green-800">
                Active
              </Badge>
            </div>
          </div>
        )}

        {/* BYOK Status */}
        {hasApiKey && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Access Type</span>
              <span className="font-medium">Your OpenAI Key</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comparisons</span>
              <span className="font-medium text-primary">Unlimited</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Using your own API key. API costs are billed directly by OpenAI.
            </p>
          </div>
        )}

        {/* Past Due Warning */}
        {subscriptionStatus === "past_due" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Your payment is past due. Please update your payment method to continue using BidLevel.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isPaidPlan || stripeCustomerId ? (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>
          ) : (
            !hasApiKey && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/pricing">
                  <Button variant="outline" className="w-full gap-2 border-accent/30 text-accent hover:bg-accent/10">
                    <Coins className="h-4 w-4" />
                    Buy Credits
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    Go Unlimited
                  </Button>
                </Link>
              </div>
            )
          )}

          {hasApiKey && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> BYOK (Bring Your Own Key) is a legacy feature.
                New users can purchase credits or subscribe for unlimited access.
                Your API key will continue to work as long as it&apos;s configured.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
