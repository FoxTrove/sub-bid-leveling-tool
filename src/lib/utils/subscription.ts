import type { Profile, PlanType } from "@/types"
import { SIGNUP_BONUS_CREDITS } from "./constants"

export interface UsageStatus {
  canCreateComparison: boolean
  creditBalance: number
  plan: PlanType
  hasApiKey: boolean // Grandfathered BYOK users
  isSubscriptionActive: boolean
  accessType: "subscription" | "credits" | "byok" | "none"
  reason?: string
}

export function getUsageStatus(profile: Profile): UsageStatus {
  const plan = profile.plan || "free"
  const hasApiKey = !!profile.openai_api_key_encrypted // Grandfathered BYOK
  const creditBalance = profile.credit_balance || 0
  const isSubscriptionActive = profile.subscription_status === "active"

  // Priority 1: Active subscription = unlimited
  if (plan !== "free" && isSubscriptionActive) {
    return {
      canCreateComparison: true,
      creditBalance,
      plan,
      hasApiKey,
      isSubscriptionActive: true,
      accessType: "subscription",
    }
  }

  // Priority 2: Grandfathered BYOK users get unlimited
  if (hasApiKey) {
    return {
      canCreateComparison: true,
      creditBalance,
      plan,
      hasApiKey: true,
      isSubscriptionActive,
      accessType: "byok",
    }
  }

  // Priority 3: Credit balance - need at least 1 credit
  if (creditBalance >= 1) {
    return {
      canCreateComparison: true,
      creditBalance,
      plan,
      hasApiKey: false,
      isSubscriptionActive: false,
      accessType: "credits",
    }
  }

  // No access - need to purchase credits or subscribe
  return {
    canCreateComparison: false,
    creditBalance,
    plan: "free",
    hasApiKey: false,
    isSubscriptionActive: false,
    accessType: "none",
    reason: "You're out of credits. Purchase more credits or subscribe for unlimited access.",
  }
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString()
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
