"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Gift, CheckCircle2, Key, Clock, Database, HelpCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { PROMO_CODES } from "@/lib/utils/constants"
import { trackOnboardingCompleted, trackSignUp, setUserId } from "@/lib/analytics"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState("")
  const [gcName, setGcName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [trainingDataOptIn, setTrainingDataOptIn] = useState(false)

  // Check for promo code from session storage
  useEffect(() => {
    const savedPromoCode = sessionStorage.getItem("bidvet_promo_code")
    if (savedPromoCode && savedPromoCode in PROMO_CODES) {
      setPromoCode(savedPromoCode)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim() || !companyName.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Build update object with promo code if present
      const updateData: Record<string, unknown> = {
        full_name: fullName.trim(),
        gc_name: gcName.trim() || null,
        company_name: companyName.trim(),
        onboarding_completed: true,
        training_data_opt_in: trainingDataOptIn,
        training_data_opted_in_at: trainingDataOptIn ? new Date().toISOString() : null,
      }

      // Add promo code if valid
      if (promoCode && promoCode in PROMO_CODES) {
        updateData.promo_code = promoCode
        updateData.promo_applied_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)

      if (error) throw error

      // Clear promo code from session storage
      sessionStorage.removeItem("bidvet_promo_code")

      // Send welcome email for HANDSHAKE users (fire and forget)
      if (promoCode === "HANDSHAKE") {
        fetch("/api/email/welcome", { method: "POST" }).catch(console.error)
      }

      // Track analytics events
      setUserId(user.id)
      trackSignUp({ method: 'magic_link', promo_code: promoCode || undefined })
      trackOnboardingCompleted(promoCode || undefined)

      if (promoCode === "HANDSHAKE") {
        toast.success("Welcome! You have 30 days of free unlimited access.")
      } else {
        toast.success("Profile setup complete!")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error("Failed to save profile")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        {promoCode === "HANDSHAKE" && (
          <div className="border-b bg-green-50 dark:bg-green-900/20 px-6 py-4">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 mb-3">
              <Gift className="h-5 w-5" />
              <span className="font-semibold">Partner Access Activated</span>
            </div>
            <div className="space-y-2 text-sm text-green-600 dark:text-green-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>30 days unlimited access—we cover all costs</span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 shrink-0" />
                <span>After 30 days, add your OpenAI key (~$1-3/comparison)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>BidVet is free forever—no subscription to us</span>
              </div>
            </div>
          </div>
        )}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to BidVet</CardTitle>
          <CardDescription>
            {promoCode === "HANDSHAKE"
              ? "Complete your profile to get started. Your info appears on bid comparison reports."
              : "Let's set up your account. This information will appear on your bid comparison reports."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Your Name *</Label>
              <Input
                id="fullName"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Smith Construction Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gcName">GC Contact Name (Optional)</Label>
              <Input
                id="gcName"
                placeholder="General Contractor contact name"
                value={gcName}
                onChange={(e) => setGcName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                If you work with a specific GC, enter their name here
              </p>
            </div>

            {/* Training Data Opt-In */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Help Improve BidVet</p>
                  <p className="text-xs text-muted-foreground">
                    Allow us to use anonymized data from your comparisons to improve our AI.
                    Your company info and bid details are never shared—only patterns help train better models.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-8">
                <Checkbox
                  id="trainingData"
                  checked={trainingDataOptIn}
                  onCheckedChange={(checked) => setTrainingDataOptIn(checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="trainingData" className="text-sm font-normal cursor-pointer">
                  Yes, I consent to contribute anonymized data to improve BidVet
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-8">
                You can change this anytime in Settings.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
