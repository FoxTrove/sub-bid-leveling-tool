"use client"

import { useState } from "react"
import Link from "next/link"
import { CreditCard, Loader2, Sparkles, Key, ExternalLink } from "lucide-react"
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
  hasApiKey: boolean
  stripeCustomerId: string | null
}

export function BillingSection({
  plan,
  subscriptionStatus,
  subscriptionPeriodEnd,
  billingCycle,
  comparisonsUsed,
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

  // Calculate usage for free tier
  const usagePercent = hasApiKey || isPaidPlan
    ? 0
    : Math.min((comparisonsUsed / FREE_COMPARISON_LIMIT) * 100, 100)
  const remaining = FREE_COMPARISON_LIMIT - comparisonsUsed

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
          ) : (
            <Badge className={getPlanBadgeColor(plan)}>
              {plan !== "free" && <Sparkles className="mr-1 h-3 w-3" />}
              {getPlanDisplayName(plan)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comparisons</span>
            <span className="font-medium">
              {hasApiKey || isPaidPlan ? (
                "Unlimited"
              ) : (
                `${comparisonsUsed} / ${FREE_COMPARISON_LIMIT} used`
              )}
            </span>
          </div>
          {!hasApiKey && !isPaidPlan && (
            <div className="space-y-1">
              <Progress value={usagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {remaining > 0
                  ? `${remaining} comparison${remaining !== 1 ? 's' : ''} remaining`
                  : "No comparisons remaining - upgrade or add API key"
                }
              </p>
            </div>
          )}
        </div>

        {/* Subscription Details */}
        {isPaidPlan && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
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
              <Badge variant="outline" className="text-green-600 border-green-200">
                Active
              </Badge>
            </div>
          </div>
        )}

        {/* Past Due Warning */}
        {subscriptionStatus === "past_due" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              Your payment is past due. Please update your payment method to continue using BidLevel.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
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
              <Link href="/pricing">
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              </Link>
            )
          )}

          {!hasApiKey && (
            <p className="text-center text-xs text-muted-foreground">
              Or bring your own OpenAI API key below for unlimited free access
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
