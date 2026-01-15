"use client"

import Link from "next/link"
import { Clock, Key } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getTrialDaysRemaining, isTrialExpired } from "@/lib/utils/format"

interface TrialBannerProps {
  trialStartedAt: string
  hasOwnApiKey: boolean
}

export function TrialBanner({ trialStartedAt, hasOwnApiKey }: TrialBannerProps) {
  // If user has their own API key, don't show the banner
  if (hasOwnApiKey) {
    return null
  }

  const daysRemaining = getTrialDaysRemaining(trialStartedAt)
  const expired = isTrialExpired(trialStartedAt)

  if (expired) {
    return (
      <Alert variant="destructive" className="mb-6">
        <Key className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Your free trial has ended. Add your own OpenAI API key to continue
            analyzing bids.
          </span>
          <Link href="/settings">
            <Button variant="outline" size="sm" className="ml-4">
              Add API Key
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6 border-primary/20 bg-primary/5">
      <Clock className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          <strong>{daysRemaining} days</strong> remaining in your free trial.
          After that, you&apos;ll need to add your own OpenAI API key.
        </span>
        <Link href="/settings">
          <Button variant="outline" size="sm" className="ml-4">
            Add API Key Now
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
