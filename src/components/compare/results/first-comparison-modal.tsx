"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sparkles, Key, Users, CheckCircle2, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { trackEvent } from "@/lib/analytics"

interface FirstComparisonModalProps {
  comparisonsUsed: number
  hasApiKey: boolean
  isSubscriptionActive: boolean
  promoCode?: string | null
  freeRemaining: number
}

const STORAGE_KEY = "bidvet_first_comparison_modal_shown"

export function FirstComparisonModal({
  comparisonsUsed,
  hasApiKey,
  isSubscriptionActive,
  promoCode,
  freeRemaining,
}: FirstComparisonModalProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Only show on first comparison
    if (comparisonsUsed !== 1) return

    // Don't show for subscribers or BYOK users
    if (isSubscriptionActive || hasApiKey) return

    // Check if we've already shown this modal
    const hasShown = localStorage.getItem(STORAGE_KEY)
    if (hasShown) return

    // Show the modal after a short delay so user can see results first
    const timer = setTimeout(() => {
      setOpen(true)
      trackEvent("first_comparison_modal_shown", {
        promo_code: promoCode || undefined,
        free_remaining: freeRemaining,
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [comparisonsUsed, hasApiKey, isSubscriptionActive, promoCode, freeRemaining])

  const handleClose = () => {
    setOpen(false)
    localStorage.setItem(STORAGE_KEY, "true")
    trackEvent("first_comparison_modal_dismissed", {
      promo_code: promoCode || undefined,
    })
  }

  const handleCTAClick = (type: "api_key" | "team") => {
    localStorage.setItem(STORAGE_KEY, "true")
    trackEvent("first_comparison_modal_cta_clicked", {
      cta_type: type,
      promo_code: promoCode || undefined,
    })
  }

  const isHandshake = promoCode === "HANDSHAKE"

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            {isHandshake ? "Great first comparison!" : "Nice work on your first comparison!"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isHandshake
              ? "You're using BidVet for free as a HANDSHAKE partner. Here's how to keep using it after your trial."
              : `You have ${freeRemaining} free comparison${freeRemaining !== 1 ? "s" : ""} remaining. Here's how to get unlimited access.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* API Key option */}
          <Link href="/settings" onClick={() => handleCTAClick("api_key")} className="block">
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 hover:border-primary/40 hover:bg-primary/10 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Add Your API Key</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Use your own OpenAI key for unlimited comparisons. You only pay OpenAI for what you use.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-primary font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Free forever
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </div>
          </Link>

          {/* Team option */}
          <Link href="/pricing?plan=team" onClick={() => handleCTAClick("team")} className="block">
            <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 hover:border-accent/50 hover:bg-accent/10 transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 shrink-0">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Upgrade to Team</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Collaborate with up to 10 team members. We handle the API—no setup needed.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-accent font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    $199/month for the whole team
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </div>
          </Link>
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
