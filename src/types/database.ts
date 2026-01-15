export type ProjectStatus = 'draft' | 'uploading' | 'processing' | 'complete' | 'error'
export type DocumentStatus = 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error'
export type PlanType = 'free' | 'pro' | 'team' | 'enterprise'
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'trialing'
export type BillingCycle = 'monthly' | 'annual'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  gc_name: string | null
  trial_started_at: string
  openai_api_key_encrypted: string | null
  onboarding_completed: boolean
  password_set: boolean
  // Subscription fields
  plan: PlanType
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  subscription_period_end: string | null
  comparisons_used: number
  billing_cycle: BillingCycle | null
  // Credit system fields
  credit_balance: number
  credits_purchased_total: number
  last_credit_purchase_at: string | null
  created_at: string
  updated_at: string
}

export type CreditTransactionType = 'purchase' | 'usage' | 'refund' | 'bonus' | 'signup'

export interface CreditTransaction {
  id: string
  user_id: string
  type: CreditTransactionType
  amount: number
  balance_after: number
  description: string | null
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  project_id: string | null
  created_at: string
}

export interface ProjectFolder {
  id: string
  user_id: string
  name: string
  location: string | null
  client_name: string | null
  project_size: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  folder_id: string | null
  name: string
  trade_type: string
  location: string | null
  project_size: string | null
  deadline: string | null
  notes: string | null
  status: ProjectStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface BidDocument {
  id: string
  project_id: string
  contractor_name: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  upload_status: DocumentStatus
  raw_text: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface ExtractedItem {
  id: string
  bid_document_id: string
  description: string
  quantity: number | null
  unit: string | null
  unit_price: number | null
  total_price: number | null
  category: string | null
  normalized_category: string | null
  is_exclusion: boolean
  is_inclusion: boolean
  confidence_score: number
  needs_review: boolean
  raw_text: string | null
  ai_notes: string | null
  user_modified: boolean
  created_at: string
  updated_at: string
}

export interface ContractorSummary {
  id: string
  name: string
  total_bid: number
  base_bid: number
  exclusions_value: number
  item_count: number
  exclusion_count: number
  confidence_avg: number
}

export interface ScopeGap {
  description: string
  present_in: string[]
  missing_from: string[]
  estimated_value: number | null
}

export interface ComparisonSummary {
  contractors: ContractorSummary[]
  categories: {
    name: string
    totals_by_contractor: Record<string, number>
  }[]
  scope_gaps: ScopeGap[]
}

export interface RecommendationFactor {
  factor: string
  description: string
}

export interface RecommendationWarning {
  type: string
  description: string
  contractor_id?: string
}

export interface Recommendation {
  recommended_contractor_id: string
  recommended_contractor_name: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  key_factors: RecommendationFactor[]
  warnings: RecommendationWarning[]
}

export interface ComparisonResult {
  id: string
  project_id: string
  total_bids: number
  price_low: number | null
  price_high: number | null
  price_average: number | null
  total_scope_items: number
  common_items: number
  gap_items: number
  summary_json: ComparisonSummary
  recommendation_json: Recommendation
  generated_at: string
  updated_at: string
}

// Extended types for queries with relations
export interface ProjectWithDocuments extends Project {
  bid_documents: BidDocument[]
}

export interface ProjectWithResults extends Project {
  bid_documents: BidDocumentWithItems[]
  comparison_results: ComparisonResult | null
}

export interface BidDocumentWithItems extends BidDocument {
  extracted_items: ExtractedItem[]
}

// Folder with nested projects for dashboard display
export interface ProjectForDashboard extends Project {
  bid_documents: { id: string }[]
  comparison_results: {
    price_low: number | null
    price_high: number | null
    recommendation_json: Recommendation | null
  } | null
}

export interface FolderWithProjects extends ProjectFolder {
  projects: ProjectForDashboard[]
}

// Trade types for the dropdown
export const TRADE_TYPES = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Mechanical',
  'Fire Protection',
  'Roofing',
  'Concrete',
  'Masonry',
  'Steel/Structural',
  'Drywall/Framing',
  'Painting',
  'Flooring',
  'Millwork/Casework',
  'Glass/Glazing',
  'Landscaping',
  'Sitework/Earthwork',
  'Demolition',
  'Insulation',
  'Waterproofing',
  'Other',
] as const

export type TradeType = typeof TRADE_TYPES[number]
