"use client"

import { useState } from "react"
import Link from "next/link"
import { Zap, Key, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

interface UpgradePromptProps {
  comparisonsUsed: number
  comparisonsLimit: number
  onApiKeyClick?: () => void
}

export function UpgradePrompt({
  comparisonsUsed,
  comparisonsLimit,
  onApiKeyClick,
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async (plan: "pro" | "team", interval: "monthly" | "annual") => {
    setIsLoading(true)
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

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start checkout")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">You&apos;ve Hit Your Limit</h2>
        <p className="text-muted-foreground mt-2">
          You&apos;ve used {comparisonsUsed} of {comparisonsLimit} free comparisons.
          <br />
          Upgrade to continue leveling bids.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Pro Plan */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Pro Plan
            </CardTitle>
            <CardDescription>For busy estimators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              $79<span className="text-lg font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              or $790/year (save 2 months)
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Unlimited comparisons</li>
              <li>Priority processing</li>
              <li>Email support</li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => handleUpgrade("pro", "annual")}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade to Pro"}
            </Button>
          </CardFooter>
        </Card>

        {/* BYOK Option */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Bring Your Own Key
            </CardTitle>
            <CardDescription>For the tech-savvy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Free<span className="text-lg font-normal text-muted-foreground"> forever</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Use your own OpenAI API key
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Unlimited comparisons</li>
              <li>You pay OpenAI directly</li>
              <li>~$0.10-0.50 per comparison</li>
            </ul>
          </CardContent>
          <CardFooter>
            {onApiKeyClick ? (
              <Button variant="outline" className="w-full" onClick={onApiKeyClick}>
                Add API Key
              </Button>
            ) : (
              <Link href="/settings" className="w-full">
                <Button variant="outline" className="w-full">
                  Add API Key
                </Button>
              </Link>
            )}
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
