/**
 * Google Analytics 4 tracking for BidLevel
 *
 * Events tracked:
 * - Page views (automatic)
 * - User signup / login
 * - Invite link visits
 * - Onboarding completion
 * - Comparison created / completed
 * - API key added
 * - Credit purchase
 * - Subscription events
 */

// Extend window type for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// Event names - keep consistent for GA4 reports
export const AnalyticsEvents = {
  // Auth events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Invite/Promo
  INVITE_LINK_VIEWED: 'invite_link_viewed',
  PROMO_CODE_APPLIED: 'promo_code_applied',

  // Core product
  COMPARISON_STARTED: 'comparison_started',
  DOCUMENTS_UPLOADED: 'documents_uploaded',
  COMPARISON_COMPLETED: 'comparison_completed',
  COMPARISON_EXPORTED: 'comparison_exported',

  // Settings
  API_KEY_ADDED: 'api_key_added',
  API_KEY_REMOVED: 'api_key_removed',
  PASSWORD_SET: 'password_set',

  // Monetization
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  PURCHASE_COMPLETED: 'purchase',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  CREDITS_PURCHASED: 'credits_purchased',

  // Engagement
  HELP_CLICKED: 'help_clicked',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
} as const

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

// Event parameter types
interface BaseEventParams {
  [key: string]: string | number | boolean | undefined
}

interface SignUpParams extends BaseEventParams {
  method: 'magic_link' | 'password' | 'oauth'
  promo_code?: string
}

interface LoginParams extends BaseEventParams {
  method: 'magic_link' | 'password' | 'oauth'
}

interface ComparisonParams extends BaseEventParams {
  comparison_id?: string
  document_count?: number
  document_types?: string
}

interface PurchaseParams extends BaseEventParams {
  transaction_id?: string
  value?: number
  currency?: string
  items?: string
}

interface InviteParams extends BaseEventParams {
  invite_token?: string
  promo_code?: string
}

// Check if we're in browser and GA is loaded
function isGtagAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Track a page view (automatic in GA4, but can be called manually for SPAs)
 */
export function trackPageView(path?: string, title?: string) {
  if (!isGtagAvailable()) return

  window.gtag?.('event', 'page_view', {
    page_path: path || window.location.pathname,
    page_title: title || document.title,
  })
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: AnalyticsEvent | string,
  params?: BaseEventParams
) {
  if (!isGtagAvailable()) return

  window.gtag?.('event', eventName, params)

  // Also log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, params)
  }
}

// Convenience functions for common events

export function trackSignUp(params: SignUpParams) {
  trackEvent(AnalyticsEvents.SIGN_UP, params)
}

export function trackLogin(params: LoginParams) {
  trackEvent(AnalyticsEvents.LOGIN, params)
}

export function trackInviteLinkViewed(params: InviteParams) {
  trackEvent(AnalyticsEvents.INVITE_LINK_VIEWED, params)
}

export function trackPromoCodeApplied(promoCode: string) {
  trackEvent(AnalyticsEvents.PROMO_CODE_APPLIED, { promo_code: promoCode })
}

export function trackOnboardingCompleted(promoCode?: string) {
  trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
    promo_code: promoCode,
  })
}

export function trackComparisonStarted(params?: ComparisonParams) {
  trackEvent(AnalyticsEvents.COMPARISON_STARTED, params)
}

export function trackDocumentsUploaded(count: number, types: string[]) {
  trackEvent(AnalyticsEvents.DOCUMENTS_UPLOADED, {
    document_count: count,
    document_types: types.join(','),
  })
}

export function trackComparisonCompleted(params: ComparisonParams) {
  trackEvent(AnalyticsEvents.COMPARISON_COMPLETED, params)
}

export function trackComparisonExported(format: 'pdf' | 'csv') {
  trackEvent(AnalyticsEvents.COMPARISON_EXPORTED, { format })
}

export function trackApiKeyAdded() {
  trackEvent(AnalyticsEvents.API_KEY_ADDED)
}

export function trackApiKeyRemoved() {
  trackEvent(AnalyticsEvents.API_KEY_REMOVED)
}

export function trackPricingPageViewed(source?: string) {
  trackEvent(AnalyticsEvents.PRICING_PAGE_VIEWED, { source })
}

export function trackCheckoutStarted(params: PurchaseParams) {
  trackEvent(AnalyticsEvents.CHECKOUT_STARTED, params)
}

export function trackPurchaseCompleted(params: PurchaseParams) {
  // Use GA4's built-in purchase event for e-commerce tracking
  trackEvent(AnalyticsEvents.PURCHASE_COMPLETED, {
    ...params,
    currency: params.currency || 'USD',
  })
}

export function trackCreditsPurchased(packName: string, amount: number) {
  trackEvent(AnalyticsEvents.CREDITS_PURCHASED, {
    pack_name: packName,
    value: amount,
    currency: 'USD',
  })
}

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
