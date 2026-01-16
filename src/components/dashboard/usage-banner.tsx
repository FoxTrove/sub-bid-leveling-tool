"use client"

import Link from "next/link"
import { Coins, Sparkles, Gift, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FREE_COMPARISON_LIMIT } from "@/lib/utils/constants"

interface UsageBannerProps {
  comparisonsUsed: number
  creditBalance: number
  hasApiKey: boolean
  isSubscriptionActive: boolean
}

export function UsageBanner({
  comparisonsUsed,
  creditBalance,
  hasApiKey,
  isSubscriptionActive,
}: UsageBannerProps) {
  // Don't show for subscribers or BYOK users
  if (isSubscriptionActive || hasApiKey) {
    return null
  }

  const freeRemaining = Math.max(FREE_COMPARISON_LIMIT - comparisonsUsed, 0)
  const usagePercent = Math.min((comparisonsUsed / FREE_COMPARISON_LIMIT) * 100, 100)

  // User has credits
  if (creditBalance > 0) {
    return (
      <div className="mb-6 rounded-xl border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
              <Coins className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Credit Balance</p>
              <p className="text-2xl font-bold text-accent">
                {creditBalance} comparison{creditBalance !== 1 ? 's' : ''} remaining
              </p>
              {freeRemaining > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plus {freeRemaining} free comparison{freeRemaining !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/pricing">
              <Button variant="outline" className="border-accent/30 text-accent hover:bg-accent/10">
                Buy More Credits
              </Button>
            </Link>
            <Link href="/pricing">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Sparkles className="mr-2 h-4 w-4" />
                Go Unlimited
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Free tier user with remaining comparisons
  if (freeRemaining > 0) {
    return (
      <div className="mb-6 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free Comparisons</p>
                <p className="text-2xl font-bold">
                  <span className="text-primary">{freeRemaining}</span>
                  <span className="text-muted-foreground text-lg font-normal"> of {FREE_COMPARISON_LIMIT} remaining</span>
                </p>
              </div>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                View Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-1">
            <Progress value={100 - usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {comparisonsUsed > 0
                ? `You've used ${comparisonsUsed} of your ${FREE_COMPARISON_LIMIT} free comparisons`
                : "You haven't used any free comparisons yet"
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // No credits or free comparisons left
  return (
    <div className="mb-6 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/20">
            <Coins className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">No comparisons remaining</p>
            <p className="text-sm text-muted-foreground">
              Purchase credits or subscribe for unlimited access
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/pricing">
            <Button variant="outline">
              Buy Credits
            </Button>
          </Link>
          <Link href="/pricing">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Go Unlimited
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
