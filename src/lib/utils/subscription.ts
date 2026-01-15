import type { Profile, PlanType } from "@/types"
import { FREE_COMPARISON_LIMIT, PLAN_LIMITS } from "./constants"

export interface UsageStatus {
  canCreateComparison: boolean
  comparisonsUsed: number
  comparisonsLimit: number | null // null = unlimited
  comparisonsRemaining: number | null // null = unlimited
  plan: PlanType
  hasApiKey: boolean
  isSubscriptionActive: boolean
  reason?: string
}

export function getUsageStatus(profile: Profile): UsageStatus {
  const plan = profile.plan || "free"
  const hasApiKey = !!profile.openai_api_key_encrypted
  const comparisonsUsed = profile.comparisons_used || 0
  const isSubscriptionActive = profile.subscription_status === "active"

  // Users with their own API key get unlimited access
  if (hasApiKey) {
    return {
      canCreateComparison: true,
      comparisonsUsed,
      comparisonsLimit: null,
      comparisonsRemaining: null,
      plan,
      hasApiKey: true,
      isSubscriptionActive,
    }
  }

  // Paid plans with active subscription get unlimited
  if (plan !== "free" && isSubscriptionActive) {
    return {
      canCreateComparison: true,
      comparisonsUsed,
      comparisonsLimit: null,
      comparisonsRemaining: null,
      plan,
      hasApiKey: false,
      isSubscriptionActive: true,
    }
  }

  // Free plan has limited comparisons
  const limit = FREE_COMPARISON_LIMIT
  const remaining = Math.max(0, limit - comparisonsUsed)
  const canCreate = remaining > 0

  return {
    canCreateComparison: canCreate,
    comparisonsUsed,
    comparisonsLimit: limit,
    comparisonsRemaining: remaining,
    plan: "free",
    hasApiKey: false,
    isSubscriptionActive: false,
    reason: canCreate
      ? undefined
      : "You've used all your free comparisons. Upgrade to Pro or add your own API key to continue.",
  }
}

export function getPlanDisplayName(plan: PlanType): string {
  switch (plan) {
    case "free":
      return "Free"
    case "pro":
      return "Pro"
    case "team":
      return "Team"
    case "enterprise":
      return "Enterprise"
    default:
      return "Free"
  }
}

export function getPlanBadgeColor(plan: PlanType): string {
  switch (plan) {
    case "pro":
      return "bg-blue-100 text-blue-800"
    case "team":
      return "bg-purple-100 text-purple-800"
    case "enterprise":
      return "bg-amber-100 text-amber-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
