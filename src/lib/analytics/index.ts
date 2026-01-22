/**
 * Google Analytics 4 tracking for BidVet
 *
 * Harmonized with Foxtrove unified analytics approach.
 * All events automatically include `product: 'bidvet'`
 *
 * Events tracked:
 * - Page views (automatic + custom)
 * - Modal open/close with step tracking
 * - Form step progression
 * - User authentication (signup, login, logout)
 * - Comparison tool usage (detailed)
 * - Document uploads
 * - API key management
 * - Purchases and subscriptions
 * - Errors
 */

// Extend window type for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// Product identifier - used on all events for cross-product analytics
const PRODUCT_ID = 'bidvet'

// ============================================
// EVENT NAMES - Consistent naming convention
// ============================================

export const AnalyticsEvents = {
  // Page/View Events
  PAGE_VIEW_CUSTOM: 'page_view_custom',

  // Modal Events
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',

  // Form Events
  FORM_STEP: 'form_step',
  FORM_FIELD_INTERACTION: 'form_field_interaction',

  // Auth Events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Invite/Promo
  INVITE_LINK_VIEWED: 'invite_link_viewed',
  PROMO_CODE_APPLIED: 'promo_code_applied',

  // Comparison Tool - Core Flow
  COMPARISON_STARTED: 'comparison_started',
  COMPARISON_STEP: 'comparison_step',
  DOCUMENTS_UPLOADED: 'documents_uploaded',
  DOCUMENT_REMOVED: 'document_removed',
  PROCESSING_STARTED: 'processing_started',
  PROCESSING_COMPLETED: 'processing_completed',
  PROCESSING_FAILED: 'processing_failed',
  RESULTS_VIEWED: 'results_viewed',
  COMPARISON_EXPORTED: 'comparison_exported',
  COMPARISON_ABANDONED: 'comparison_abandoned',

  // Comparison Tool - Detailed Interactions
  BID_SELECTED: 'bid_selected',
  SCOPE_GAP_VIEWED: 'scope_gap_viewed',
  RECOMMENDATION_VIEWED: 'recommendation_viewed',
  COMPARISON_SHARED: 'comparison_shared',

  // Settings/API Key
  API_KEY_ADDED: 'api_key_added',
  API_KEY_REMOVED: 'api_key_removed',
  API_KEY_TEST: 'api_key_test',
  PASSWORD_SET: 'password_set',
  SETTINGS_CHANGED: 'settings_changed',

  // Monetization
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  CHECKOUT_STARTED: 'begin_checkout',
  PURCHASE_COMPLETED: 'purchase',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  CREDITS_PURCHASED: 'credits_purchased',

  // Engagement
  CTA_CLICK: 'cta_click',
  HELP_CLICKED: 'help_clicked',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  FILE_DOWNLOAD: 'file_download',

  // Errors
  SUBMISSION_ERROR: 'submission_error',
  PROCESSING_ERROR: 'processing_error',
  UPLOAD_ERROR: 'upload_error',
} as const

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

// ============================================
// CORE TRACKING FUNCTION
// ============================================

function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Core event tracking function
 * Automatically adds product identifier to all events
 */
export function trackEvent(
  eventName: AnalyticsEvent | string,
  params?: Record<string, unknown>
): void {
  const enrichedParams = {
    product: PRODUCT_ID,
    ...params,
  }

  if (isGtagAvailable()) {
    window.gtag?.('event', eventName, enrichedParams)
  }

  // Log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, enrichedParams)
  }
}

// ============================================
// PAGE VIEW EVENTS
// ============================================

/**
 * Track page view (automatic, but can be called manually for SPAs)
 */
export function trackPageView(path?: string, title?: string) {
  if (!isGtagAvailable()) return

  window.gtag?.('event', 'page_view', {
    product: PRODUCT_ID,
    page_path: path || window.location.pathname,
    page_title: title || document.title,
  })
}

/**
 * Track custom page view with additional context
 */
export function trackPageViewCustom(pageName: string, pageCategory?: string) {
  trackEvent(AnalyticsEvents.PAGE_VIEW_CUSTOM, {
    page_name: pageName,
    page_category: pageCategory,
  })
}

// ============================================
// MODAL EVENTS
// ============================================

/**
 * Track when a modal opens
 */
export function trackModalOpen(modalType: string, source?: string) {
  trackEvent(AnalyticsEvents.MODAL_OPEN, {
    modal_type: modalType,
    source: source,
  })
}

/**
 * Track when a modal closes
 */
export function trackModalClose(
  modalType: string,
  stepReached: number,
  totalSteps: number,
  completed: boolean = false
) {
  trackEvent(AnalyticsEvents.MODAL_CLOSE, {
    modal_type: modalType,
    step_reached: stepReached,
    total_steps: totalSteps,
    completed: completed,
  })
}

// ============================================
// FORM EVENTS
// ============================================

/**
 * Track form step progression
 */
export function trackFormStep(
  formName: string,
  stepNumber: number,
  stepName: string,
  totalSteps: number
) {
  trackEvent(AnalyticsEvents.FORM_STEP, {
    form_name: formName,
    step_number: stepNumber,
    step_name: stepName,
    total_steps: totalSteps,
  })
}

/**
 * Track form field interactions (for detailed funnel analysis)
 */
export function trackFormFieldInteraction(
  formName: string,
  fieldName: string,
  interactionType: 'focus' | 'blur' | 'change'
) {
  trackEvent(AnalyticsEvents.FORM_FIELD_INTERACTION, {
    form_name: formName,
    field_name: fieldName,
    interaction_type: interactionType,
  })
}

// ============================================
// AUTH EVENTS
// ============================================

export function trackSignUp(params: {
  method: 'magic_link' | 'password' | 'oauth'
  promo_code?: string
  email_id?: string // Which email in sequence (1-6)
  campaign?: string // Campaign name (e.g., 'handshake')
  source?: string // Traffic source (e.g., 'instantly')
}) {
  trackEvent(AnalyticsEvents.SIGN_UP, params)
}

export function trackLogin(params: {
  method: 'magic_link' | 'password' | 'oauth'
}) {
  trackEvent(AnalyticsEvents.LOGIN, params)
}

export function trackLogout() {
  trackEvent(AnalyticsEvents.LOGOUT)
}

// ============================================
// ONBOARDING EVENTS
// ============================================

export function trackOnboardingStarted() {
  trackEvent(AnalyticsEvents.ONBOARDING_STARTED)
}

export function trackOnboardingCompleted(promoCode?: string) {
  trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
    promo_code: promoCode,
  })
}

// ============================================
// INVITE/PROMO EVENTS
// ============================================

export function trackInviteLinkViewed(params: {
  invite_token?: string
  promo_code?: string
  email_id?: string // Which email in sequence (1-6)
  campaign?: string // Campaign name (e.g., 'handshake')
  source?: string // Traffic source (e.g., 'instantly')
}) {
  trackEvent(AnalyticsEvents.INVITE_LINK_VIEWED, params)
}

export function trackPromoCodeApplied(promoCode: string) {
  trackEvent(AnalyticsEvents.PROMO_CODE_APPLIED, { promo_code: promoCode })
}

// ============================================
// COMPARISON TOOL - CORE FLOW
// ============================================

/**
 * Track when user starts a new comparison
 */
export function trackComparisonStarted(params?: {
  source?: string // 'dashboard', 'cta', 'empty_state'
  project_name?: string
}) {
  trackEvent(AnalyticsEvents.COMPARISON_STARTED, params)
}

/**
 * Track comparison wizard step progression
 */
export function trackComparisonStep(
  stepNumber: number,
  stepName: string,
  totalSteps: number = 3
) {
  trackEvent(AnalyticsEvents.COMPARISON_STEP, {
    form_name: 'comparison_wizard',
    step_number: stepNumber,
    step_name: stepName,
    total_steps: totalSteps,
  })
}

/**
 * Track document uploads
 */
export function trackDocumentsUploaded(params: {
  document_count: number
  document_types: string[] // ['pdf', 'xlsx', 'docx']
  total_size_mb?: number
}) {
  trackEvent(AnalyticsEvents.DOCUMENTS_UPLOADED, {
    document_count: params.document_count,
    document_types: params.document_types.join(','),
    total_size_mb: params.total_size_mb,
  })
}

/**
 * Track document removal
 */
export function trackDocumentRemoved(documentType: string) {
  trackEvent(AnalyticsEvents.DOCUMENT_REMOVED, {
    document_type: documentType,
  })
}

/**
 * Track when AI processing starts
 */
export function trackProcessingStarted(params: {
  comparison_id: string
  document_count: number
}) {
  trackEvent(AnalyticsEvents.PROCESSING_STARTED, params)
}

/**
 * Track successful processing completion
 */
export function trackProcessingCompleted(params: {
  comparison_id: string
  document_count: number
  processing_time_seconds?: number
  scope_items_found?: number
  scope_gaps_found?: number
}) {
  trackEvent(AnalyticsEvents.PROCESSING_COMPLETED, params)
}

/**
 * Track processing failure
 */
export function trackProcessingFailed(params: {
  comparison_id: string
  error_type: string
  error_message?: string
}) {
  trackEvent(AnalyticsEvents.PROCESSING_FAILED, params)
}

/**
 * Track when user views results
 */
export function trackResultsViewed(params: {
  comparison_id: string
  time_since_completion_seconds?: number
}) {
  trackEvent(AnalyticsEvents.RESULTS_VIEWED, params)
}

/**
 * Track comparison export
 */
export function trackComparisonExported(params: {
  comparison_id?: string
  format: 'pdf' | 'csv'
}) {
  trackEvent(AnalyticsEvents.COMPARISON_EXPORTED, params)
}

/**
 * Track when user abandons comparison mid-flow
 */
export function trackComparisonAbandoned(params: {
  step_reached: number
  step_name: string
  total_steps: number
  documents_uploaded?: number
}) {
  trackEvent(AnalyticsEvents.COMPARISON_ABANDONED, params)
}

// ============================================
// COMPARISON TOOL - DETAILED INTERACTIONS
// ============================================

/**
 * Track when user selects/highlights a specific bid
 */
export function trackBidSelected(params: {
  comparison_id: string
  bid_rank?: number // 1 = recommended, 2 = second, etc.
  is_recommended?: boolean
}) {
  trackEvent(AnalyticsEvents.BID_SELECTED, params)
}

/**
 * Track when user views scope gap details
 */
export function trackScopeGapViewed(params: {
  comparison_id: string
  gap_count?: number
}) {
  trackEvent(AnalyticsEvents.SCOPE_GAP_VIEWED, params)
}

/**
 * Track when user views AI recommendation
 */
export function trackRecommendationViewed(params: {
  comparison_id: string
  confidence_score?: number
}) {
  trackEvent(AnalyticsEvents.RECOMMENDATION_VIEWED, params)
}

/**
 * Track comparison sharing
 */
export function trackComparisonShared(params: {
  comparison_id: string
  share_method: 'link' | 'email' | 'download'
}) {
  trackEvent(AnalyticsEvents.COMPARISON_SHARED, params)
}

// ============================================
// API KEY / SETTINGS EVENTS
// ============================================

export function trackApiKeyAdded() {
  trackEvent(AnalyticsEvents.API_KEY_ADDED)
}

export function trackApiKeyRemoved() {
  trackEvent(AnalyticsEvents.API_KEY_REMOVED)
}

export function trackApiKeyTest(success: boolean) {
  trackEvent(AnalyticsEvents.API_KEY_TEST, { success })
}

export function trackPasswordSet() {
  trackEvent(AnalyticsEvents.PASSWORD_SET)
}

export function trackSettingsChanged(settingName: string, newValue?: string) {
  trackEvent(AnalyticsEvents.SETTINGS_CHANGED, {
    setting_name: settingName,
    new_value: newValue,
  })
}

// ============================================
// MONETIZATION EVENTS
// ============================================

export function trackPricingPageViewed(source?: string) {
  trackEvent(AnalyticsEvents.PRICING_PAGE_VIEWED, { source })
}

export function trackCheckoutStarted(params: {
  item_name: string
  value: number
  currency?: string
  purchase_type: 'subscription_monthly' | 'subscription_annual' | 'credits'
}) {
  trackEvent(AnalyticsEvents.CHECKOUT_STARTED, {
    ...params,
    currency: params.currency || 'USD',
  })
}

export function trackPurchaseCompleted(params: {
  transaction_id: string
  value: number
  currency?: string
  item_name: string
  purchase_type: 'subscription_monthly' | 'subscription_annual' | 'credits'
}) {
  trackEvent(AnalyticsEvents.PURCHASE_COMPLETED, {
    ...params,
    currency: params.currency || 'USD',
  })
}

export function trackCreditsPurchased(params: {
  pack_name: string
  value: number
  credits_amount?: number
}) {
  trackEvent(AnalyticsEvents.CREDITS_PURCHASED, {
    ...params,
    currency: 'USD',
    purchase_type: 'credits',
  })
}

export function trackSubscriptionStarted(params: {
  plan_name: string
  value: number
  billing_cycle: 'monthly' | 'annual'
}) {
  trackEvent(AnalyticsEvents.SUBSCRIPTION_STARTED, {
    ...params,
    currency: 'USD',
  })
}

export function trackSubscriptionCancelled(planName: string) {
  trackEvent(AnalyticsEvents.SUBSCRIPTION_CANCELLED, { plan_name: planName })
}

// ============================================
// ENGAGEMENT EVENTS
// ============================================

export function trackCtaClick(
  ctaName: string,
  ctaLocation: string,
  destination?: string
) {
  trackEvent(AnalyticsEvents.CTA_CLICK, {
    cta_name: ctaName,
    cta_location: ctaLocation,
    destination: destination,
  })
}

export function trackHelpClicked(helpType: string, location: string) {
  trackEvent(AnalyticsEvents.HELP_CLICKED, {
    help_type: helpType,
    location: location,
  })
}

export function trackFeedbackSubmitted(feedbackType: string, rating?: number) {
  trackEvent(AnalyticsEvents.FEEDBACK_SUBMITTED, {
    feedback_type: feedbackType,
    rating: rating,
  })
}

export function trackFileDownload(fileName: string, fileType: string) {
  trackEvent(AnalyticsEvents.FILE_DOWNLOAD, {
    file_name: fileName,
    file_type: fileType,
  })
}

// ============================================
// ERROR EVENTS
// ============================================

export function trackSubmissionError(params: {
  form_name: string
  error_type: string
  error_message?: string
}) {
  trackEvent(AnalyticsEvents.SUBMISSION_ERROR, params)
}

export function trackProcessingError(params: {
  comparison_id?: string
  error_type: string
  error_message?: string
  step?: string
}) {
  trackEvent(AnalyticsEvents.PROCESSING_ERROR, params)
}

export function trackUploadError(params: {
  file_type: string
  error_type: string // 'size_exceeded', 'invalid_type', 'upload_failed'
  file_size_mb?: number
}) {
  trackEvent(AnalyticsEvents.UPLOAD_ERROR, params)
}

// ============================================
// USER IDENTITY
// ============================================

/**
 * Set user ID for cross-device tracking (call after login)
 */
export function setUserId(userId: string) {
  if (!isGtagAvailable()) return
  window.gtag?.('set', { user_id: userId })
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, string | number | boolean>) {
  if (!isGtagAvailable()) return
  window.gtag?.('set', 'user_properties', properties)
}

/**
 * Clear user data (call on logout)
 */
export function clearUserData() {
  if (!isGtagAvailable()) return
  window.gtag?.('set', { user_id: null })
}
