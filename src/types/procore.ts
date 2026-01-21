// ============================================
// PROCORE INTEGRATION TYPES
// ============================================

export type ProcoreSourceSystem = 'manual' | 'procore'

// OAuth Types
export interface ProcoreTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  created_at: number
}

export interface ProcoreOAuthError {
  error: string
  error_description?: string
}

// User/Company Types
export interface ProcoreCompany {
  id: number
  name: string
  is_active: boolean
}

export interface ProcoreUser {
  id: number
  login: string
  name: string
  email_address: string
}

export interface ProcoreMe {
  id: number
  login: string
  name: string
  email_address: string
  companies: ProcoreCompany[]
}

// Project Types
export interface ProcoreProject {
  id: number
  name: string
  display_name: string
  project_number: string | null
  address: string | null
  city: string | null
  state_code: string | null
  zip: string | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
  stage: string | null
  phone: string | null
  created_at: string
  updated_at: string
  active: boolean
  start_date: string | null
  completion_date: string | null
  total_value: number | null
  store_number: string | null
  accounting_project_number: string | null
  designated_market_area: string | null
  time_zone: string | null
  company: {
    id: number
    name: string
  }
}

// Bidding Types
export interface ProcoreBidPackage {
  id: number
  title: string
  number: string | null
  description: string | null
  status: 'draft' | 'out_for_bid' | 'closed' | 'awarded'
  bid_due_date: string | null
  bid_email: string | null
  pre_bid_meeting_date: string | null
  pre_bid_meeting_location: string | null
  created_at: string
  updated_at: string
  distributed: boolean
  project: {
    id: number
    name: string
  }
}

export interface ProcoreBid {
  id: number
  bid_package_id: number
  vendor_id: number
  lump_sum_amount: number | null
  submitted: boolean
  submitted_at: string | null
  awarded: boolean
  created_at: string
  updated_at: string
  vendor: ProcoreVendor
  attachments?: ProcoreAttachment[]
}

export interface ProcoreVendor {
  id: number
  name: string
  company: string | null
  email_address: string | null
  business_phone: string | null
  address: string | null
  city: string | null
  state_code: string | null
  zip: string | null
  country_code: string | null
}

export interface ProcoreAttachment {
  id: number
  name: string
  url: string
  content_type: string
  file_size: number
}

// API Response Types
export interface ProcoreListResponse<T> {
  data: T[]
  pagination?: {
    total: number
    per_page: number
    current_page: number
    total_pages: number
  }
}

// Profile extension for Procore fields
export interface ProfileProcoreFields {
  procore_access_token_encrypted: string | null
  procore_refresh_token_encrypted: string | null
  procore_company_id: string | null
  procore_company_name: string | null
  procore_user_id: string | null
  procore_token_expires_at: string | null
  procore_connected_at: string | null
}

// Project extension for Procore fields
export interface ProjectProcoreFields {
  procore_project_id: string | null
  procore_project_name: string | null
  source_system: ProcoreSourceSystem
}

// BidDocument extension for Procore fields
export interface BidDocumentProcoreFields {
  procore_bid_id: string | null
  procore_vendor_id: string | null
  source_system: 'upload' | 'procore'
}

// Connection status for UI
export interface ProcoreConnectionStatus {
  isConnected: boolean
  companyName: string | null
  companyId: string | null
  connectedAt: string | null
  tokenExpired: boolean
}

// Import types
export interface ProcoreImportRequest {
  procoreProjectId: number
  bidPackageId?: number
  includeBids: boolean
}

export interface ProcoreImportResult {
  success: boolean
  projectId: string
  documentsImported: number
  errors: string[]
}
