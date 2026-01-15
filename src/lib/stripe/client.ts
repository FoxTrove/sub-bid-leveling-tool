import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
})

// Price IDs from environment
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "",
  },
  team: {
    monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || "",
  },
} as const

export type PlanKey = keyof typeof STRIPE_PRICES
export type BillingInterval = "monthly" | "annual"

export function getPriceId(plan: PlanKey, interval: BillingInterval): string {
  return STRIPE_PRICES[plan][interval]
}
