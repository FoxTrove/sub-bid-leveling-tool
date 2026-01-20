import type { Profile, PlanType } from "@/types"
import { SIGNUP_BONUS_CREDITS, HANDSHAKE_FREE_PERIOD_DAYS } from "./constants"

export interface UsageStatus {
  canCreateComparison: boolean
  creditBalance: number
  plan: PlanType
  hasApiKey: boolean // Grandfathered BYOK users or HANDSHAKE users
  isSubscriptionActive: boolean
  accessType: "subscription" | "credits" | "byok" | "handshake" | "handshake_byok" | "none"
  reason?: string
  // HANDSHAKE-specific fields
  isHandshakeUser?: boolean
  handshakeFreePeriodEndsAt?: Date
  handshakeFreePeriodExpired?: boolean
  handshakeDaysRemaining?: number
}

/**
 * Check if a user is a HANDSHAKE promo user
 */
export function isHandshakeUser(profile: Profile): boolean {
  return profile.promo_code === "HANDSHAKE"
}

/**
 * Check if HANDSHAKE user is still within their free 30-day period
 */
export function getHandshakeStatus(profile: Profile): {
  isHandshake: boolean
  freePeriodEndsAt: Date | null
  isFreePeriodActive: boolean
  daysRemaining: number
} {
  if (profile.promo_code !== "HANDSHAKE" || !profile.promo_applied_at) {
    return { isHandshake: false, freePeriodEndsAt: null, isFreePeriodActive: false, daysRemaining: 0 }
  }

  const appliedAt = new Date(profile.promo_applied_at)
  const freePeriodEndsAt = new Date(appliedAt)
  freePeriodEndsAt.setDate(freePeriodEndsAt.getDate() + HANDSHAKE_FREE_PERIOD_DAYS)

  const now = new Date()
  const isFreePeriodActive = now < freePeriodEndsAt
  const msRemaining = freePeriodEndsAt.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))

  return {
    isHandshake: true,
    freePeriodEndsAt,
    isFreePeriodActive,
    daysRemaining,
  }
}

export function getUsageStatus(profile: Profile): UsageStatus {
  const plan = profile.plan || "free"
  const hasApiKey = !!profile.openai_api_key_encrypted
  const creditBalance = profile.credit_balance || 0
  const isSubscriptionActive = profile.subscription_status === "active"
  const handshakeStatus = getHandshakeStatus(profile)

  // Priority 0: HANDSHAKE users have special access
  if (handshakeStatus.isHandshake) {
    // If within free period, they get unlimited access with our key
    if (handshakeStatus.isFreePeriodActive) {
      return {
        canCreateComparison: true,
        creditBalance,
        plan,
        hasApiKey,
        isSubscriptionActive,
        accessType: "handshake",
        isHandshakeUser: true,
        handshakeFreePeriodEndsAt: handshakeStatus.freePeriodEndsAt!,
        handshakeFreePeriodExpired: false,
        handshakeDaysRemaining: handshakeStatus.daysRemaining,
      }
    }

    // After free period, they need BYOK to continue
    if (hasApiKey) {
      return {
        canCreateComparison: true,
        creditBalance,
        plan,
        hasApiKey: true,
        isSubscriptionActive,
        accessType: "handshake_byok",
        isHandshakeUser: true,
        handshakeFreePeriodEndsAt: handshakeStatus.freePeriodEndsAt!,
        handshakeFreePeriodExpired: true,
        handshakeDaysRemaining: 0,
      }
    }

    // Free period expired and no BYOK - need to add their key
    return {
      canCreateComparison: false,
      creditBalance,
      plan,
      hasApiKey: false,
      isSubscriptionActive,
      accessType: "none",
      reason: "Your 30-day free period has ended. Add your OpenAI API key to continue using BidVet for free.",
      isHandshakeUser: true,
      handshakeFreePeriodEndsAt: handshakeStatus.freePeriodEndsAt!,
      handshakeFreePeriodExpired: true,
      handshakeDaysRemaining: 0,
    }
  }

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

  // Priority 2: Grandfathered BYOK users get unlimited (non-HANDSHAKE legacy users only)
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

/**
 * Check if a user should see the BYOK option
 * Only HANDSHAKE users and grandfathered legacy users can use BYOK
 */
export function canUseBYOK(profile: Profile): boolean {
  // HANDSHAKE users can always use BYOK
  if (profile.promo_code === "HANDSHAKE") {
    return true
  }

  // Legacy grandfathered users who already have a key configured
  if (profile.openai_api_key_encrypted) {
    return true
  }

  // New users cannot access BYOK
  return false
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
