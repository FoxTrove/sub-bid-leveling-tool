import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Analytics queries for understanding AI performance and training data patterns.
 * Used to inform prompt engineering improvements and track model quality.
 */

export interface TradeConfidenceStats {
  trade_type: string
  total_runs: number
  avg_confidence: number
  min_confidence: number
  max_confidence: number
  low_confidence_rate: number
  avg_extraction_duration_ms: number
}

export interface CorrectionPatternStats {
  trade_type: string
  correction_type: string
  count: number
  avg_original_confidence: number
}

export interface ErrorRateStats {
  trade_type: string
  document_type: string
  total_runs: number
  failure_count: number
  failure_rate: number
  common_error_codes: string[]
}

export interface WeeklyMetricsSummary {
  period_start: string
  period_end: string
  total_analyses: number
  successful_analyses: number
  success_rate: number
  avg_confidence: number
  avg_extraction_duration_ms: number
  avg_normalization_duration_ms: number
  total_scope_gaps: number
  trades_analyzed: { trade_type: string; count: number }[]
  confidence_by_trade: TradeConfidenceStats[]
  top_correction_patterns: CorrectionPatternStats[]
  error_summary: ErrorRateStats[]
}

/**
 * Get confidence statistics grouped by trade type
 */
export async function getConfidenceByTrade(
  supabase: SupabaseClient,
  days: number = 30
): Promise<TradeConfidenceStats[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const { data, error } = await supabase
    .from('ai_pipeline_metrics')
    .select('trade_type, avg_confidence_score, min_confidence_score, extraction_duration_ms, low_confidence_items_count, extraction_items_count')
    .gte('created_at', cutoffDate.toISOString())
    .not('avg_confidence_score', 'is', null)

  if (error || !data) {
    console.error('Error fetching confidence stats:', error)
    return []
  }

  // Group by trade type and calculate stats
  const grouped = data.reduce((acc, row) => {
    if (!acc[row.trade_type]) {
      acc[row.trade_type] = {
        confidences: [],
        minConfidences: [],
        durations: [],
        lowConfidenceCounts: [],
        itemCounts: [],
      }
    }
    if (row.avg_confidence_score) acc[row.trade_type].confidences.push(row.avg_confidence_score)
    if (row.min_confidence_score) acc[row.trade_type].minConfidences.push(row.min_confidence_score)
    if (row.extraction_duration_ms) acc[row.trade_type].durations.push(row.extraction_duration_ms)
    if (row.low_confidence_items_count !== null) acc[row.trade_type].lowConfidenceCounts.push(row.low_confidence_items_count)
    if (row.extraction_items_count) acc[row.trade_type].itemCounts.push(row.extraction_items_count)
    return acc
  }, {} as Record<string, { confidences: number[]; minConfidences: number[]; durations: number[]; lowConfidenceCounts: number[]; itemCounts: number[] }>)

  return Object.entries(grouped).map(([trade_type, stats]) => {
    const totalItems = stats.itemCounts.reduce((a, b) => a + b, 0)
    const totalLowConf = stats.lowConfidenceCounts.reduce((a, b) => a + b, 0)

    return {
      trade_type,
      total_runs: stats.confidences.length,
      avg_confidence: stats.confidences.length > 0
        ? stats.confidences.reduce((a, b) => a + b, 0) / stats.confidences.length
        : 0,
      min_confidence: stats.minConfidences.length > 0
        ? Math.min(...stats.minConfidences)
        : 0,
      max_confidence: stats.confidences.length > 0
        ? Math.max(...stats.confidences)
        : 0,
      low_confidence_rate: totalItems > 0 ? totalLowConf / totalItems : 0,
      avg_extraction_duration_ms: stats.durations.length > 0
        ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        : 0,
    }
  }).sort((a, b) => a.avg_confidence - b.avg_confidence) // Lowest confidence first
}

/**
 * Get correction patterns from training contributions
 */
export async function getCorrectionPatterns(
  supabase: SupabaseClient,
  status: 'pending' | 'approved' | 'all' = 'approved',
  days: number = 90
): Promise<CorrectionPatternStats[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  let query = supabase
    .from('training_contributions')
    .select('trade_type, correction_type, confidence_score_original')
    .gte('contributed_at', cutoffDate.toISOString())

  if (status !== 'all') {
    query = query.eq('moderation_status', status)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error fetching correction patterns:', error)
    return []
  }

  // Group by trade_type + correction_type
  const grouped = data.reduce((acc, row) => {
    const key = `${row.trade_type}|${row.correction_type}`
    if (!acc[key]) {
      acc[key] = {
        trade_type: row.trade_type,
        correction_type: row.correction_type,
        count: 0,
        confidences: [],
      }
    }
    acc[key].count++
    if (row.confidence_score_original !== null) {
      acc[key].confidences.push(row.confidence_score_original)
    }
    return acc
  }, {} as Record<string, { trade_type: string; correction_type: string; count: number; confidences: number[] }>)

  return Object.values(grouped)
    .map((stats) => ({
      trade_type: stats.trade_type,
      correction_type: stats.correction_type,
      count: stats.count,
      avg_original_confidence: stats.confidences.length > 0
        ? stats.confidences.reduce((a, b) => a + b, 0) / stats.confidences.length
        : 0,
    }))
    .sort((a, b) => b.count - a.count) // Most common first
}

/**
 * Get error rates by trade and document type
 */
export async function getErrorRates(
  supabase: SupabaseClient,
  days: number = 30
): Promise<ErrorRateStats[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const { data, error } = await supabase
    .from('ai_pipeline_metrics')
    .select('trade_type, document_type, extraction_success, extraction_error_code')
    .gte('created_at', cutoffDate.toISOString())

  if (error || !data) {
    console.error('Error fetching error rates:', error)
    return []
  }

  // Group by trade_type + document_type
  const grouped = data.reduce((acc, row) => {
    const key = `${row.trade_type}|${row.document_type}`
    if (!acc[key]) {
      acc[key] = {
        trade_type: row.trade_type,
        document_type: row.document_type,
        total: 0,
        failures: 0,
        errorCodes: [],
      }
    }
    acc[key].total++
    if (!row.extraction_success) {
      acc[key].failures++
      if (row.extraction_error_code) {
        acc[key].errorCodes.push(row.extraction_error_code)
      }
    }
    return acc
  }, {} as Record<string, { trade_type: string; document_type: string; total: number; failures: number; errorCodes: string[] }>)

  return Object.values(grouped)
    .filter((stats) => stats.failures > 0)
    .map((stats) => {
      // Count error codes and get most common
      const errorCodeCounts = stats.errorCodes.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const commonErrorCodes = Object.entries(errorCodeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([code]) => code)

      return {
        trade_type: stats.trade_type,
        document_type: stats.document_type,
        total_runs: stats.total,
        failure_count: stats.failures,
        failure_rate: stats.total > 0 ? stats.failures / stats.total : 0,
        common_error_codes: commonErrorCodes,
      }
    })
    .sort((a, b) => b.failure_rate - a.failure_rate)
}

/**
 * Generate a comprehensive weekly metrics summary
 */
export async function getWeeklyMetricsSummary(
  supabase: SupabaseClient
): Promise<WeeklyMetricsSummary> {
  const periodEnd = new Date()
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - 7)

  // Get raw metrics data
  const { data: metricsData } = await supabase
    .from('ai_pipeline_metrics')
    .select('*')
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())

  const metrics = metricsData || []

  // Calculate overall stats
  const successful = metrics.filter((m) => m.extraction_success)
  const avgConfidences = metrics
    .filter((m) => m.avg_confidence_score !== null)
    .map((m) => m.avg_confidence_score as number)
  const extractionDurations = metrics
    .filter((m) => m.extraction_duration_ms !== null)
    .map((m) => m.extraction_duration_ms as number)
  const normalizationDurations = metrics
    .filter((m) => m.normalization_duration_ms !== null)
    .map((m) => m.normalization_duration_ms as number)
  const scopeGaps = metrics
    .filter((m) => m.normalization_scope_gaps_count !== null)
    .reduce((sum, m) => sum + (m.normalization_scope_gaps_count || 0), 0)

  // Group by trade
  const tradesCounts = metrics.reduce((acc, m) => {
    acc[m.trade_type] = (acc[m.trade_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const tradesAnalyzed = Object.entries(tradesCounts)
    .map(([trade_type, count]) => ({ trade_type, count: count as number }))
    .sort((a, b) => b.count - a.count)

  // Get detailed breakdowns
  const confidenceByTrade = await getConfidenceByTrade(supabase, 7)
  const topCorrectionPatterns = await getCorrectionPatterns(supabase, 'all', 7)
  const errorSummary = await getErrorRates(supabase, 7)

  return {
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    total_analyses: metrics.length,
    successful_analyses: successful.length,
    success_rate: metrics.length > 0 ? successful.length / metrics.length : 0,
    avg_confidence: avgConfidences.length > 0
      ? avgConfidences.reduce((a, b) => a + b, 0) / avgConfidences.length
      : 0,
    avg_extraction_duration_ms: extractionDurations.length > 0
      ? extractionDurations.reduce((a, b) => a + b, 0) / extractionDurations.length
      : 0,
    avg_normalization_duration_ms: normalizationDurations.length > 0
      ? normalizationDurations.reduce((a, b) => a + b, 0) / normalizationDurations.length
      : 0,
    total_scope_gaps: scopeGaps,
    trades_analyzed: tradesAnalyzed,
    confidence_by_trade: confidenceByTrade,
    top_correction_patterns: topCorrectionPatterns.slice(0, 10),
    error_summary: errorSummary,
  }
}

/**
 * Get trades that have fallen below a confidence threshold
 * Used for alerting
 */
export async function getLowConfidenceTrades(
  supabase: SupabaseClient,
  threshold: number = 0.7,
  minSamples: number = 5,
  days: number = 14
): Promise<TradeConfidenceStats[]> {
  const stats = await getConfidenceByTrade(supabase, days)
  return stats.filter(
    (s) => s.avg_confidence < threshold && s.total_runs >= minSamples
  )
}
