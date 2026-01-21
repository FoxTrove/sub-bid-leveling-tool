"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface UserEditFormProps {
  userId: string
  currentPlan: string | null
  currentStatus: string | null
  currentCredits: number
  currentPromoCode: string | null
}

export function UserEditForm({
  userId,
  currentPlan,
  currentStatus,
  currentCredits,
  currentPromoCode,
}: UserEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState(currentPlan || 'free')
  const [status, setStatus] = useState(currentStatus || 'inactive')
  const [creditAdjustment, setCreditAdjustment] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [promoCode, setPromoCode] = useState(currentPromoCode || '')

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {}

      if (plan !== currentPlan) {
        updates.plan = plan
      }

      if (status !== currentStatus) {
        updates.subscription_status = status
      }

      if (creditAdjustment) {
        updates.credit_adjustment = parseInt(creditAdjustment)
        updates.credit_adjustment_reason = creditReason || undefined
      }

      if (promoCode !== currentPromoCode) {
        updates.promo_code = promoCode || null
      }

      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save")
        return
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      toast.success("User updated successfully")
      router.refresh()

      // Reset credit fields
      setCreditAdjustment('')
      setCreditReason('')
    } catch (error) {
      toast.error("Failed to update user")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100">Edit User</CardTitle>
        <CardDescription className="text-slate-400">
          Modify user plan, status, or credits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Selection */}
        <div className="space-y-2">
          <Label className="text-slate-300">Plan</Label>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="free" className="text-slate-100">Free</SelectItem>
              <SelectItem value="pro" className="text-slate-100">Pro</SelectItem>
              <SelectItem value="team" className="text-slate-100">Team</SelectItem>
              <SelectItem value="enterprise" className="text-slate-100">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label className="text-slate-300">Subscription Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="inactive" className="text-slate-100">Inactive</SelectItem>
              <SelectItem value="active" className="text-slate-100">Active</SelectItem>
              <SelectItem value="trialing" className="text-slate-100">Trialing</SelectItem>
              <SelectItem value="past_due" className="text-slate-100">Past Due</SelectItem>
              <SelectItem value="canceled" className="text-slate-100">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promo Code */}
        <div className="space-y-2">
          <Label className="text-slate-300">Promo Code</Label>
          <Input
            placeholder="e.g., HANDSHAKE"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Credit Adjustment */}
        <div className="space-y-2">
          <Label className="text-slate-300">
            Credit Adjustment
            <span className="text-slate-500 ml-2 font-normal">
              (Current: {currentCredits})
            </span>
          </Label>
          <Input
            type="number"
            placeholder="e.g., +10 or -5"
            value={creditAdjustment}
            onChange={(e) => setCreditAdjustment(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
          {creditAdjustment && (
            <div className="space-y-2">
              <Label className="text-slate-300">Reason (optional)</Label>
              <Textarea
                placeholder="Reason for adjustment..."
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none"
                rows={2}
              />
              <p className="text-xs text-slate-500">
                New balance will be: {Math.max(0, currentCredits + parseInt(creditAdjustment || '0'))} credits
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
