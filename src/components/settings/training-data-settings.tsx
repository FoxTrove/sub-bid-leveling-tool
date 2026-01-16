"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Shield, Heart, CheckCircle2 } from "lucide-react"

interface TrainingDataSettingsProps {
  initialOptIn: boolean
  initialContributionCount: number
}

export function TrainingDataSettings({
  initialOptIn,
  initialContributionCount,
}: TrainingDataSettingsProps) {
  const [optIn, setOptIn] = useState(initialOptIn)
  const [contributionCount, setContributionCount] = useState(initialContributionCount)
  const [loading, setLoading] = useState(false)
  const [showConsentDialog, setShowConsentDialog] = useState(false)

  const handleToggle = async (checked: boolean) => {
    if (checked && !optIn) {
      // Show consent dialog before opting in
      setShowConsentDialog(true)
      return
    }

    // Opting out - proceed directly
    await updateOptIn(false)
  }

  const handleConfirmOptIn = async () => {
    setShowConsentDialog(false)
    await updateOptIn(true)
  }

  const updateOptIn = async (value: boolean) => {
    setLoading(true)
    try {
      const response = await fetch("/api/settings/training-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opt_in: value }),
      })

      if (response.ok) {
        setOptIn(value)
      } else {
        console.error("Failed to update training data setting")
      }
    } catch (error) {
      console.error("Error updating training data setting:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle>Help Improve BidLevel</CardTitle>
          </div>
          <CardDescription>
            Optionally contribute anonymized corrections to help improve our AI accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Contribute Training Data</p>
              <p className="text-sm text-muted-foreground">
                When you correct AI extractions, share anonymized data to improve the model
              </p>
            </div>
            <Switch
              checked={optIn}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>

          {optIn && (
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">Privacy Protected</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>Company names are replaced with placeholders</li>
                <li>Dollar amounts are converted to ranges</li>
                <li>Contact info and addresses are removed</li>
                <li>No link to your account or projects</li>
              </ul>
              {contributionCount > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    You&apos;ve contributed{" "}
                    <span className="font-medium">{contributionCount}</span>{" "}
                    {contributionCount === 1 ? "correction" : "corrections"} to improve BidLevel
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help Improve BidLevel AI</DialogTitle>
            <DialogDescription>
              By opting in, you agree to share anonymized corrections to help improve our extraction accuracy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">What we collect:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Original AI extraction vs your correction</li>
                <li>Trade type (Electrical, Plumbing, etc.)</li>
                <li>Type of correction (description, price, category)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                What we remove (anonymized):
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Company and contractor names</li>
                <li>Exact dollar amounts (converted to ranges)</li>
                <li>Phone numbers, emails, addresses</li>
                <li>Project identifiers and dates</li>
                <li>Any link to your account</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              You can opt out at any time. Previously contributed data remains anonymous and cannot be traced back to you.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmOptIn} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable Contributions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
