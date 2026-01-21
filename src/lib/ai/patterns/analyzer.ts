import { createClient } from "@/lib/supabase/server"
import type { TradeType } from "@/types"

export interface PatternCandidate {
  tradeType: string
  refinementType: "terminology" | "category_rule" | "extraction_rule"
  patternKey: string
  patternValue: {
    from: string
    to: string
    context?: string
  }
  occurrenceCount: number
}

export interface PatternAnalysisResult {
  newPatterns: PatternCandidate[]
  updatedPatterns: PatternCandidate[]
  promotedPatterns: PatternCandidate[]
}

// Minimum occurrences to auto-promote a pattern
const AUTO_PROMOTE_THRESHOLD = 10

/**
 * Analyze approved corrections and extract repeating patterns.
 * Returns patterns grouped by trade type and refinement type.
 */
export async function analyzePatterns(
  tradeType?: string
): Promise<PatternAnalysisResult> {
  const supabase = await createClient()

  // Query approved corrections
  const query = supabase
    .from("training_contributions")
    .select("trade_type, correction_type, original_value, corrected_value")
    .eq("moderation_status", "approved")

  if (tradeType) {
    query.eq("trade_type", tradeType)
  }

  const { data: corrections, error } = await query

  if (error || !corrections) {
    console.error("[PatternAnalyzer] Failed to fetch corrections:", error?.message)
    return { newPatterns: [], updatedPatterns: [], promotedPatterns: [] }
  }

  // Group corrections into patterns
  const patternMap = new Map<string, PatternCandidate>()

  for (const correction of corrections) {
    const patterns = extractPatterns(correction)

    for (const pattern of patterns) {
      const key = `${pattern.tradeType}:${pattern.refinementType}:${pattern.patternKey}`
      const existing = patternMap.get(key)

      if (existing) {
        existing.occurrenceCount++
      } else {
        patternMap.set(key, pattern)
      }
    }
  }

  const candidates = Array.from(patternMap.values())

  // Fetch existing patterns to determine new vs updated
  const { data: existingPatterns } = await supabase
    .from("prompt_refinements")
    .select("trade_type, refinement_type, pattern_key, occurrence_count, is_active")

  const existingMap = new Map(
    (existingPatterns || []).map((p) => [
      `${p.trade_type}:${p.refinement_type}:${p.pattern_key}`,
      p,
    ])
  )

  const newPatterns: PatternCandidate[] = []
  const updatedPatterns: PatternCandidate[] = []
  const promotedPatterns: PatternCandidate[] = []

  for (const candidate of candidates) {
    const key = `${candidate.tradeType}:${candidate.refinementType}:${candidate.patternKey}`
    const existing = existingMap.get(key)

    if (!existing) {
      newPatterns.push(candidate)

      // Auto-promote if threshold met
      if (candidate.occurrenceCount >= AUTO_PROMOTE_THRESHOLD) {
        promotedPatterns.push(candidate)
      }
    } else if (candidate.occurrenceCount > existing.occurrence_count) {
      updatedPatterns.push(candidate)

      // Auto-promote if newly crossed threshold
      if (
        !existing.is_active &&
        candidate.occurrenceCount >= AUTO_PROMOTE_THRESHOLD
      ) {
        promotedPatterns.push(candidate)
      }
    }
  }

  return { newPatterns, updatedPatterns, promotedPatterns }
}

/**
 * Extract patterns from a single correction
 */
function extractPatterns(correction: {
  trade_type: string
  correction_type: string
  original_value: Record<string, unknown>
  corrected_value: Record<string, unknown>
}): PatternCandidate[] {
  const patterns: PatternCandidate[] = []

  switch (correction.correction_type) {
    case "description": {
      const originalText = getStringValue(correction.original_value, "text")
      const correctedText = getStringValue(correction.corrected_value, "text")

      if (originalText && correctedText && originalText !== correctedText) {
        // Extract the key pattern (normalized lowercase for matching)
        const patternKey = normalizePatternKey(originalText)

        patterns.push({
          tradeType: correction.trade_type,
          refinementType: "terminology",
          patternKey,
          patternValue: {
            from: originalText,
            to: correctedText,
          },
          occurrenceCount: 1,
        })
      }
      break
    }

    case "category": {
      const originalCategory = getStringValue(correction.original_value, "value")
      const correctedCategory = getStringValue(correction.corrected_value, "value")

      if (
        originalCategory &&
        correctedCategory &&
        originalCategory !== correctedCategory
      ) {
        const patternKey = normalizePatternKey(originalCategory)

        patterns.push({
          tradeType: correction.trade_type,
          refinementType: "category_rule",
          patternKey,
          patternValue: {
            from: originalCategory,
            to: correctedCategory,
          },
          occurrenceCount: 1,
        })
      }
      break
    }

    case "exclusion_flag": {
      const originalValue = correction.original_value.value
      const correctedValue = correction.corrected_value.value

      // Track patterns where items were incorrectly marked as excluded/included
      if (typeof originalValue === "boolean" && typeof correctedValue === "boolean") {
        const patternKey = `exclusion_${originalValue}_to_${correctedValue}`

        patterns.push({
          tradeType: correction.trade_type,
          refinementType: "extraction_rule",
          patternKey,
          patternValue: {
            from: String(originalValue),
            to: String(correctedValue),
            context: "exclusion flag correction",
          },
          occurrenceCount: 1,
        })
      }
      break
    }
  }

  return patterns
}

/**
 * Normalize a string to create a consistent pattern key
 */
function normalizePatternKey(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars except hyphen
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .slice(0, 50) // Limit length
}

/**
 * Get a string value from an object, handling various formats
 */
function getStringValue(
  obj: Record<string, unknown>,
  key: string
): string | null {
  const value = obj[key]
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value)
  }
  return null
}

/**
 * Save analyzed patterns to the database
 */
export async function savePatterns(
  result: PatternAnalysisResult
): Promise<{ inserted: number; updated: number; promoted: number }> {
  const supabase = await createClient()
  let inserted = 0
  let updated = 0
  let promoted = 0

  // Insert new patterns
  if (result.newPatterns.length > 0) {
    const rows = result.newPatterns.map((p) => ({
      trade_type: p.tradeType,
      refinement_type: p.refinementType,
      pattern_key: p.patternKey,
      pattern_value: p.patternValue,
      occurrence_count: p.occurrenceCount,
      is_active: p.occurrenceCount >= AUTO_PROMOTE_THRESHOLD,
      auto_promoted_at:
        p.occurrenceCount >= AUTO_PROMOTE_THRESHOLD ? new Date().toISOString() : null,
    }))

    const { error } = await supabase.from("prompt_refinements").insert(rows)

    if (!error) {
      inserted = rows.length
    } else {
      console.error("[PatternAnalyzer] Insert error:", error.message)
    }
  }

  // Update existing patterns
  for (const pattern of result.updatedPatterns) {
    const shouldPromote = result.promotedPatterns.includes(pattern)

    const { error } = await supabase
      .from("prompt_refinements")
      .update({
        occurrence_count: pattern.occurrenceCount,
        pattern_value: pattern.patternValue,
        is_active: shouldPromote || undefined,
        auto_promoted_at: shouldPromote ? new Date().toISOString() : undefined,
      })
      .eq("trade_type", pattern.tradeType)
      .eq("refinement_type", pattern.refinementType)
      .eq("pattern_key", pattern.patternKey)

    if (!error) {
      updated++
      if (shouldPromote) promoted++
    } else {
      console.error("[PatternAnalyzer] Update error:", error.message)
    }
  }

  // Promote patterns that weren't part of updates
  const promotionsNotInUpdates = result.promotedPatterns.filter(
    (p) => !result.updatedPatterns.includes(p) && !result.newPatterns.includes(p)
  )

  for (const pattern of promotionsNotInUpdates) {
    const { error } = await supabase
      .from("prompt_refinements")
      .update({
        is_active: true,
        auto_promoted_at: new Date().toISOString(),
      })
      .eq("trade_type", pattern.tradeType)
      .eq("refinement_type", pattern.refinementType)
      .eq("pattern_key", pattern.patternKey)

    if (!error) {
      promoted++
    }
  }

  return { inserted, updated, promoted }
}

/**
 * Run a full pattern analysis cycle
 */
export async function runPatternAnalysis(
  tradeType?: string
): Promise<{
  analyzed: number
  inserted: number
  updated: number
  promoted: number
}> {
  const result = await analyzePatterns(tradeType)
  const analyzed =
    result.newPatterns.length +
    result.updatedPatterns.length

  if (analyzed === 0) {
    return { analyzed: 0, inserted: 0, updated: 0, promoted: 0 }
  }

  const saveResult = await savePatterns(result)

  return {
    analyzed,
    ...saveResult,
  }
}
