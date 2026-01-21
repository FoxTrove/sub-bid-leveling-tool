"use client"

import Link from "next/link"
import { Coins, Sparkles, Gift, ArrowRight, Key, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FREE_COMPARISON_LIMIT, HANDSHAKE_FREE_PERIOD_DAYS } from "@/lib/utils/constants"

interface UsageBannerProps {
  comparisonsUsed: number
  creditBalance: number
  hasApiKey: boolean
  isSubscriptionActive: boolean
  promoCode?: string | null
  promoAppliedAt?: string | null
}

export function UsageBanner({
  comparisonsUsed,
  creditBalance,
  hasApiKey,
  isSubscriptionActive,
  promoCode,
  promoAppliedAt,
}: UsageBannerProps) {
  // Calculate HANDSHAKE status
  const isHandshakeUser = promoCode === "HANDSHAKE"
  const handshakeStatus = (() => {
    if (!isHandshakeUser || !promoAppliedAt) return null

    const appliedAt = new Date(promoAppliedAt)
    const freePeriodEndsAt = new Date(appliedAt)
    freePeriodEndsAt.setDate(freePeriodEndsAt.getDate() + HANDSHAKE_FREE_PERIOD_DAYS)

    const now = new Date()
    const isFreePeriodActive = now < freePeriodEndsAt
    const msRemaining = freePeriodEndsAt.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))

    return { freePeriodEndsAt, isFreePeriodActive, daysRemaining }
  })()

  // HANDSHAKE user banner
  if (isHandshakeUser && handshakeStatus) {
    // Within free period - show encouraging message
    if (handshakeStatus.isFreePeriodActive) {
      return (
        <div className="mb-6 space-y-3">
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-800/50">
                  <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-400">HANDSHAKE Partner</p>
                  <p className="text-xl font-bold text-green-800 dark:text-green-300">
                    {handshakeStatus.daysRemaining} day{handshakeStatus.daysRemaining !== 1 ? 's' : ''} of free access remaining
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                    Unlimited comparisons • We provide the API key
                  </p>
                </div>
              </div>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-800/50">
                  <Key className="mr-2 h-4 w-4" />
                  Add Your API Key
                </Button>
              </Link>
            </div>
            <div className="mt-3 space-y-1">
              <Progress
                value={((HANDSHAKE_FREE_PERIOD_DAYS - handshakeStatus.daysRemaining) / HANDSHAKE_FREE_PERIOD_DAYS) * 100}
                className="h-2 bg-green-200 dark:bg-green-800"
              />
              <p className="text-xs text-green-600 dark:text-green-500">
                Add your OpenAI API key before your free period ends to continue using BidVet for free
              </p>
            </div>
          </div>
          {/* Team upsell for HANDSHAKE users */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Have a team?</p>
                  <p className="text-xs text-muted-foreground">Get your whole team on BidVet with shared access and collaboration features.</p>
                </div>
              </div>
              <Link href="/pricing?plan=team">
                <Button size="sm" variant="outline" className="shrink-0 border-accent/30 text-accent hover:bg-accent/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Free period expired but has API key - show success with Team upsell
    if (hasApiKey) {
      return (
        <div className="mb-6 space-y-3">
          <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-800/50">
                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-400">HANDSHAKE Partner</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-300">
                  Unlimited access with your API key
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                  Using your OpenAI key • API costs billed by OpenAI
                </p>
              </div>
            </div>
          </div>
          {/* Team upsell */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Upgrade to Team</p>
                  <p className="text-xs text-muted-foreground">Share access with up to 10 team members. No API key needed—we handle everything.</p>
                </div>
              </div>
              <Link href="/pricing?plan=team">
                <Button size="sm" className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  Get Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Free period expired without API key - urgent CTA with multiple options
    return (
      <div className="mb-6 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-700 dark:from-amber-900/20 dark:to-orange-900/20 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800/50">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Free period ended</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Choose how to continue using BidVet
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/settings" className="block">
              <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-white/50 dark:bg-amber-950/30 p-3 hover:bg-white dark:hover:bg-amber-900/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="font-medium text-amber-800 dark:text-amber-300">Add Your API Key</p>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500">Free forever • Pay OpenAI directly</p>
              </div>
            </Link>
            <Link href="/pricing?plan=team" className="block">
              <div className="rounded-lg border-2 border-accent/50 bg-accent/10 p-3 hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-accent" />
                  <p className="font-medium text-accent">Upgrade to Team</p>
                </div>
                <p className="text-xs text-muted-foreground">$399/mo • Up to 10 users • No API key needed</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Don't show for subscribers or BYOK users (non-HANDSHAKE)
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
