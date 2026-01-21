/**
 * Server-only module for getting calibrated confidence thresholds.
 *
 * This file uses next/headers indirectly through supabase/server,
 * so it can only be imported in server components and API routes.
 *
 * For client components, use `getDefaultConfidenceThresholds()` from
 * `@/lib/utils/constants` instead.
 */

import { getCalibratedThresholds } from './calculator'
import {
  CONFIDENCE_THRESHOLD_LOW,
  CONFIDENCE_THRESHOLD_MEDIUM,
  type ConfidenceThresholds
} from '@/lib/utils/constants'

/**
 * Get confidence thresholds for a trade type.
 * Uses calibrated thresholds if available, otherwise returns defaults.
 *
 * SERVER ONLY - This function can only be called from server components,
 * API routes, or other server-only code.
 */
export async function getConfidenceThresholds(
  tradeType: string
): Promise<ConfidenceThresholds> {
  try {
    const calibrated = await getCalibratedThresholds(tradeType)

    return {
      low: calibrated.lowThreshold,
      medium: calibrated.mediumThreshold,
      isCalibrated: calibrated.isCalibrated,
    }
  } catch (error) {
    console.error('[Thresholds] Error getting calibrated thresholds:', error)
    // Fall back to defaults if calibration lookup fails
    return {
      low: CONFIDENCE_THRESHOLD_LOW,
      medium: CONFIDENCE_THRESHOLD_MEDIUM,
      isCalibrated: false,
    }
  }
}
