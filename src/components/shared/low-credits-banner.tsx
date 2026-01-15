"use client"

import Link from "next/link"
import { AlertTriangle, X, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface LowCreditsBannerProps {
  creditBalance: number
}

export function LowCreditsBanner({ creditBalance }: LowCreditsBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Low credits remaining
              </span>
              <span className="text-sm text-amber-600 dark:text-amber-400">
                You have {creditBalance} {creditBalance === 1 ? 'comparison' : 'comparisons'} left.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Buy Credits
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/50"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
