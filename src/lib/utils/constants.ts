// Trial period duration in days
export const TRIAL_DURATION_DAYS = 30

// Maximum file size for uploads (25MB)
export const MAX_FILE_SIZE = 25 * 1024 * 1024

// Allowed file types for bid documents
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
} as const

// Min/max bids per comparison
export const MIN_BIDS = 2
export const MAX_BIDS = 5

// OpenAI model to use
export const OPENAI_MODEL = 'gpt-4o'

// Confidence thresholds
export const CONFIDENCE_THRESHOLD_LOW = 0.6
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.8

// Tooltips for bid analysis metrics
export const METRIC_TOOLTIPS = {
  bidsCompared: "The total number of subcontractor bids included in this comparison analysis.",
  priceRange: "Shows the lowest to highest base bid totals. This excludes exclusions and add-ons to give you a true baseline comparison.",
  scopeItems: "The number of unique scope items identified across all bids after AI normalization. Similar items from different contractors are grouped together.",
  scopeGaps: "Items that appear in some bids but are missing from others. These gaps can significantly impact the true cost comparison.",
  confidence: "How confident the AI is in the extracted data. 100% = clearly stated in document, 80% = reasonably inferred, 60% = some ambiguity, below 60% = needs review.",
  exclusions: "Items that contractors have explicitly excluded from their base bid. You may need to add these costs back to get the true project cost.",
} as const

// Subscription and pricing
export const FREE_COMPARISON_LIMIT = 5
export const SIGNUP_BONUS_CREDITS = 3 // Free comparisons on signup

export const PLAN_LIMITS = {
  free: { comparisons: 5, users: 1, brandedReports: false },
  pro: { comparisons: Infinity, users: 1, brandedReports: false },
  team: { comparisons: Infinity, users: 10, brandedReports: true },
  enterprise: { comparisons: Infinity, users: Infinity, brandedReports: true },
} as const

export const PRICING = {
  pro: {
    monthly: 79,
    annual: 790, // 2 months free
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || '',
  },
  team: {
    monthly: 199,
    annual: 1990, // 2 months free
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID || '',
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_TEAM_ANNUAL_PRICE_ID || '',
  },
} as const

// Credit Packs (pay-as-you-go)
export const CREDIT_PACKS = {
  starter: {
    name: 'Starter',
    price: 100, // $100
    estimatedComparisons: 15, // Estimated based on typical API usage
    bonus: null,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PACK_PRICE_ID || '',
  },
  professional: {
    name: 'Professional',
    price: 250, // $250
    estimatedComparisons: 40, // Estimated, includes ~6% bonus value
    bonus: '6% more',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PACK_PRICE_ID || '',
  },
  enterprise: {
    name: 'Enterprise',
    price: 500, // $500
    estimatedComparisons: 90, // Estimated, includes ~17% bonus value
    bonus: '17% more',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PACK_PRICE_ID || '',
  },
} as const

export type CreditPackKey = keyof typeof CREDIT_PACKS
