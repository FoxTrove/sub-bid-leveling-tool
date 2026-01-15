"use client"

import { useState } from "react"
import Link from "next/link"
import { Zap, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CREDIT_PACKS } from "@/lib/utils/constants"
import { toast } from "sonner"

interface UpgradePromptProps {
  creditBalance?: number
}

export function UpgradePrompt({ creditBalance = 0 }: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleUpgrade = async (plan: "pro" | "team", interval: "monthly" | "annual") => {
    setIsLoading(`${plan}-${interval}`)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout")
      }

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout")
      setIsLoading(null)
    }
  }

  const handleBuyCredits = async (pack: keyof typeof CREDIT_PACKS) => {
    setIsLoading(`credits-${pack}`)
    try {
      const response = await fetch("/api/stripe/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout")
      }

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout")
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">You&apos;re Out of Credits</h2>
        <p className="text-muted-foreground mt-2">
          {creditBalance === 0
            ? "Purchase credits or subscribe for unlimited access."
            : `You have ${creditBalance} credit${creditBalance !== 1 ? "s" : ""} remaining.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Buy Credits Option */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Buy Credits
            </CardTitle>
            <CardDescription>Pay as you go, no commitment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              $100
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ~15 comparisons*
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Pay only for what you use</li>
              <li>Never expires</li>
              <li>Buy more anytime</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              *Based on typical document sizes
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleBuyCredits("starter")}
              disabled={isLoading !== null}
            >
              {isLoading === "credits-starter" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Buy Starter Pack"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Pro Subscription
            </CardTitle>
            <CardDescription>Best value for regular users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              $79<span className="text-lg font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Unlimited comparisons
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Unlimited comparisons</li>
              <li>Priority processing</li>
              <li>Email support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handleUpgrade("pro", "monthly")}
              disabled={isLoading !== null}
            >
              {isLoading === "pro-monthly" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Subscribe to Pro"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center">
        <Link href="/pricing" className="text-sm text-muted-foreground hover:underline">
          View all pricing options
        </Link>
      </div>
    </div>
  )
}
