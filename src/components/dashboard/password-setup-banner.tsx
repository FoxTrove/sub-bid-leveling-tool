"use client"

import { useState } from "react"
import Link from "next/link"
import { X, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PasswordSetupBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="border-b bg-blue-50">
      <div className="container flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-blue-600" />
          <p className="text-sm text-blue-900">
            <span className="font-medium">Set up a password</span> for easier future logins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button size="sm" variant="outline" className="border-blue-200 bg-white">
              Set Password
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
