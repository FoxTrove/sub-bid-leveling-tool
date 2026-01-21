import { createClient } from "@/lib/supabase/server"
import { TRADE_TYPES } from "@/types"

export interface CalibrationResult {
  tradeType: string
  totalCorrections: number
  correctionsAtHigh: number
  correctionsAtMedium: number
  correctionsAtLow: number
  currentLowThreshold: number
  currentMediumThreshold: number
  suggestedLowThreshold: number
  suggestedMediumThreshold: number
  wasUpdated: boolean
}

// Target: high-confidence items should have < 5% correction rate
const TARGET_HIGH_CORRECTION_RATE = 0.05

// Minimum corrections needed before calibration
const MIN_CORRECTIONS_FOR_CALIBRATION = 200

/**
 * Calculate correction rates at each confidence level for a trade
 */
async function getTradeCorrections(
  tradeType: string
): Promise<{
  total: number
  byConfidenceLevel: { high: number; medium: number; low: number }
  avgConfidenceOfCorrected: number
}> {
  const supabase = await createClient()

  // Get corrections with their original confidence scores
  const { data: corrections, error } = await supabase
    .from("training_contributions")
    .select("confidence_score_original")
    .eq("trade_type", tradeType)
    .eq("moderation_status", "approved")

  if (error || !corrections) {
    return {
      total: 0,
      byConfidenceLevel: { high: 0, medium: 0, low: 0 },
      avgConfidenceOfCorrected: 0,
    }
  }

  // Get current thresholds for this trade
  const { data: thresholds } = await supabase
    .from("trade_confidence_thresholds")
    .select("low_threshold, medium_threshold")
    .eq("trade_type", tradeType)
    .single()

  const lowThreshold = thresholds?.low_threshold ?? 0.6
  const mediumThreshold = thresholds?.medium_threshold ?? 0.8

  // Count corrections by confidence level
  let high = 0
  let medium = 0
  let low = 0
  let totalConfidence = 0

  for (const correction of corrections) {
    const confidence = correction.confidence_score_original

    if (confidence === null) continue

    totalConfidence += confidence

    if (confidence >= mediumThreshold) {
      high++
    } else if (confidence >= lowThreshold) {
      medium++
    } else {
      low++
    }
  }

  return {
    total: corrections.length,
    byConfidenceLevel: { high, medium, low },
    avgConfidenceOfCorrected:
      corrections.length > 0 ? totalConfidence / corrections.length : 0,
  }
}

/**
 * Calculate suggested thresholds based on correction distribution
 */
function calculateSuggestedThresholds(
  avgConfidenceOfCorrected: number,
  currentLow: number,
  currentMedium: number
): { suggestedLow: number; suggestedMedium: number } {
  // If average confidence of corrected items is high,
  // we need to raise our thresholds
  // If it's low, our thresholds are probably fine

  // Simple heuristic: medium threshold should be above the average
  // confidence of items that needed correction
  let suggestedMedium = Math.max(
    currentMedium,
    Math.ceil((avgConfidenceOfCorrected + 0.1) * 100) / 100
  )

  // Cap at 0.95 to avoid being too strict
  suggestedMedium = Math.min(suggestedMedium, 0.95)

  // Low threshold is roughly 0.2 below medium
  let suggestedLow = suggestedMedium - 0.2

  // Cap at 0.4 minimum for low threshold
  suggestedLow = Math.max(suggestedLow, 0.4)

  // Round to 2 decimal places
  suggestedLow = Math.round(suggestedLow * 100) / 100
  suggestedMedium = Math.round(suggestedMedium * 100) / 100

  return { suggestedLow, suggestedMedium }
}

/**
 * Calibrate confidence thresholds for a single trade type
 */
export async function calibrateTrade(
  tradeType: string,
  forceUpdate: boolean = false
): Promise<CalibrationResult> {
  const supabase = await createClient()

  // Get current thresholds
  const { data: currentThresholds } = await supabase
    .from("trade_confidence_thresholds")
    .select("*")
    .eq("trade_type", tradeType)
    .single()

  const currentLow = currentThresholds?.low_threshold ?? 0.6
  const currentMedium = currentThresholds?.medium_threshold ?? 0.8

  // Get correction data
  const corrections = await getTradeCorrections(tradeType)

  const result: CalibrationResult = {
    tradeType,
    totalCorrections: corrections.total,
    correctionsAtHigh: corrections.byConfidenceLevel.high,
    correctionsAtMedium: corrections.byConfidenceLevel.medium,
    correctionsAtLow: corrections.byConfidenceLevel.low,
    currentLowThreshold: currentLow,
    currentMediumThreshold: currentMedium,
    suggestedLowThreshold: currentLow,
    suggestedMediumThreshold: currentMedium,
    wasUpdated: false,
  }

  // Skip if not enough data
  if (corrections.total < MIN_CORRECTIONS_FOR_CALIBRATION && !forceUpdate) {
    return result
  }

  // Calculate suggested thresholds
  const suggested = calculateSuggestedThresholds(
    corrections.avgConfidenceOfCorrected,
    currentLow,
    currentMedium
  )

  result.suggestedLowThreshold = suggested.suggestedLow
  result.suggestedMediumThreshold = suggested.suggestedMedium

  // Only update if thresholds actually changed
  const shouldUpdate =
    forceUpdate ||
    suggested.suggestedLow !== currentLow ||
    suggested.suggestedMedium !== currentMedium

  if (shouldUpdate) {
    const { error } = await supabase
      .from("trade_confidence_thresholds")
      .upsert({
        trade_type: tradeType,
        low_threshold: suggested.suggestedLow,
        medium_threshold: suggested.suggestedMedium,
        total_corrections: corrections.total,
        corrections_at_high: corrections.byConfidenceLevel.high,
        corrections_at_medium: corrections.byConfidenceLevel.medium,
        corrections_at_low: corrections.byConfidenceLevel.low,
        last_calibrated_at: new Date().toISOString(),
      })

    if (!error) {
      result.wasUpdated = true
    } else {
      console.error(
        `[Calibration] Error updating thresholds for ${tradeType}:`,
        error.message
      )
    }
  }

  return result
}

/**
 * Calibrate all trade types
 */
export async function calibrateAllTrades(
  forceUpdate: boolean = false
): Promise<{
  results: CalibrationResult[]
  summary: {
    totalTrades: number
    tradesUpdated: number
    tradesSkipped: number
    totalCorrectionsProcessed: number
  }
}> {
  const results: CalibrationResult[] = []
  let totalCorrections = 0

  for (const tradeType of TRADE_TYPES) {
    const result = await calibrateTrade(tradeType, forceUpdate)
    results.push(result)
    totalCorrections += result.totalCorrections
  }

  const tradesUpdated = results.filter((r) => r.wasUpdated).length
  const tradesSkipped = results.filter(
    (r) => r.totalCorrections < MIN_CORRECTIONS_FOR_CALIBRATION && !r.wasUpdated
  ).length

  return {
    results,
    summary: {
      totalTrades: TRADE_TYPES.length,
      tradesUpdated,
      tradesSkipped,
      totalCorrectionsProcessed: totalCorrections,
    },
  }
}

/**
 * Get calibrated thresholds for a trade type
 * Falls back to defaults if not calibrated
 */
export async function getCalibratedThresholds(
  tradeType: string
): Promise<{ lowThreshold: number; mediumThreshold: number; isCalibrated: boolean }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_confidence_thresholds", {
      p_trade_type: tradeType,
    })

    if (error || !data || data.length === 0) {
      return { lowThreshold: 0.6, mediumThreshold: 0.8, isCalibrated: false }
    }

    return {
      lowThreshold: data[0].low_threshold,
      mediumThreshold: data[0].medium_threshold,
      isCalibrated: data[0].is_calibrated,
    }
  } catch (error) {
    console.error("[Calibration] Error fetching thresholds:", error)
    return { lowThreshold: 0.6, mediumThreshold: 0.8, isCalibrated: false }
  }
}
