/**
 * Quality Scorer for Training Contributions
 *
 * Scores corrections based on clarity, consistency, and completeness
 * to filter high-quality examples for fine-tuning.
 */

export interface QualityFactors {
  clarity: number // How clear is the correction?
  completeness: number // Are all relevant fields present?
  consistency: number // Does it match expected patterns?
  specificity: number // Is it specific enough to be useful?
}

export interface QualityScore {
  score: number // 0-1 overall score
  factors: QualityFactors
  isHighQuality: boolean // Score >= 0.8
  notes: string[]
}

/**
 * Score a correction's quality for training purposes
 */
export function scoreCorrection(correction: {
  correction_type: string
  original_value: Record<string, unknown>
  corrected_value: Record<string, unknown>
  raw_text_snippet?: string | null
  confidence_score_original?: number | null
}): QualityScore {
  const factors: QualityFactors = {
    clarity: 0,
    completeness: 0,
    consistency: 0,
    specificity: 0,
  }
  const notes: string[] = []

  // Score clarity - how clear is the correction?
  factors.clarity = scoreClarityFactor(correction, notes)

  // Score completeness - are all expected fields present?
  factors.completeness = scoreCompletenessFactor(correction, notes)

  // Score consistency - does it match expected patterns?
  factors.consistency = scoreConsistencyFactor(correction, notes)

  // Score specificity - is it specific enough to be useful?
  factors.specificity = scoreSpecificityFactor(correction, notes)

  // Calculate weighted average
  const weights = {
    clarity: 0.3,
    completeness: 0.25,
    consistency: 0.25,
    specificity: 0.2,
  }

  const score =
    factors.clarity * weights.clarity +
    factors.completeness * weights.completeness +
    factors.consistency * weights.consistency +
    factors.specificity * weights.specificity

  return {
    score: Math.round(score * 100) / 100,
    factors,
    isHighQuality: score >= 0.8,
    notes,
  }
}

/**
 * Score clarity factor
 */
function scoreClarityFactor(
  correction: {
    correction_type: string
    original_value: Record<string, unknown>
    corrected_value: Record<string, unknown>
  },
  notes: string[]
): number {
  let score = 1.0

  // Check if original and corrected are actually different
  const origStr = JSON.stringify(correction.original_value)
  const corrStr = JSON.stringify(correction.corrected_value)

  if (origStr === corrStr) {
    notes.push("Original and corrected values are identical")
    return 0
  }

  // Check for meaningful change
  switch (correction.correction_type) {
    case "description":
      const origText = getTextValue(correction.original_value, "text") || ""
      const corrText = getTextValue(correction.corrected_value, "text") || ""

      // Penalize very minor changes (typo-level)
      const similarity = calculateSimilarity(origText, corrText)
      if (similarity > 0.95) {
        score -= 0.3
        notes.push("Very minor text change (possibly just typo)")
      }

      // Penalize if corrected text is too short
      if (corrText.length < 5) {
        score -= 0.4
        notes.push("Corrected description is very short")
      }
      break

    case "price":
      const origPrice = correction.original_value.total_price
      const corrPrice = correction.corrected_value.total_price

      // Penalize if prices are very close (rounding errors)
      if (typeof origPrice === "number" && typeof corrPrice === "number") {
        const priceDiff = Math.abs(origPrice - corrPrice)
        const percentDiff = origPrice > 0 ? priceDiff / origPrice : 1

        if (percentDiff < 0.01) {
          score -= 0.3
          notes.push("Price change is less than 1%")
        }
      }
      break
  }

  return Math.max(0, score)
}

/**
 * Score completeness factor
 */
function scoreCompletenessFactor(
  correction: {
    correction_type: string
    original_value: Record<string, unknown>
    corrected_value: Record<string, unknown>
    raw_text_snippet?: string | null
  },
  notes: string[]
): number {
  let score = 1.0

  // Bonus for having raw text context
  if (!correction.raw_text_snippet) {
    score -= 0.2
    notes.push("Missing raw text context")
  }

  // Check for expected fields based on correction type
  switch (correction.correction_type) {
    case "description":
      if (!hasValue(correction.original_value, "text")) {
        score -= 0.3
        notes.push("Missing original text")
      }
      if (!hasValue(correction.corrected_value, "text")) {
        score -= 0.3
        notes.push("Missing corrected text")
      }
      break

    case "category":
      if (!hasValue(correction.original_value, "value")) {
        score -= 0.3
        notes.push("Missing original category")
      }
      if (!hasValue(correction.corrected_value, "value")) {
        score -= 0.3
        notes.push("Missing corrected category")
      }
      break

    case "price":
      if (!hasValue(correction.original_value, "total_price")) {
        score -= 0.2
      }
      if (!hasValue(correction.corrected_value, "total_price")) {
        score -= 0.2
      }
      break
  }

  return Math.max(0, score)
}

/**
 * Score consistency factor
 */
function scoreConsistencyFactor(
  correction: {
    correction_type: string
    original_value: Record<string, unknown>
    corrected_value: Record<string, unknown>
  },
  notes: string[]
): number {
  let score = 1.0

  // Check for consistent data types
  const origKeys = Object.keys(correction.original_value)
  const corrKeys = Object.keys(correction.corrected_value)

  // Penalize if key structures are wildly different
  const commonKeys = origKeys.filter((k) => corrKeys.includes(k))
  if (commonKeys.length === 0 && origKeys.length > 0) {
    score -= 0.4
    notes.push("Original and corrected have no common keys")
  }

  // Check for type consistency
  for (const key of commonKeys) {
    const origType = typeof correction.original_value[key]
    const corrType = typeof correction.corrected_value[key]

    if (
      origType !== corrType &&
      correction.original_value[key] !== null &&
      correction.corrected_value[key] !== null
    ) {
      score -= 0.2
      notes.push(`Type mismatch for key: ${key}`)
    }
  }

  return Math.max(0, score)
}

/**
 * Score specificity factor
 */
function scoreSpecificityFactor(
  correction: {
    correction_type: string
    original_value: Record<string, unknown>
    corrected_value: Record<string, unknown>
    confidence_score_original?: number | null
  },
  notes: string[]
): number {
  let score = 1.0

  // Bonus for correcting low-confidence items (more valuable)
  if (correction.confidence_score_original != null) {
    if (correction.confidence_score_original < 0.6) {
      score += 0.1 // Bonus for correcting uncertain items
    } else if (correction.confidence_score_original > 0.9) {
      score -= 0.1 // Slight penalty - was already confident
    }
  }

  // Check specificity based on type
  switch (correction.correction_type) {
    case "description":
      const corrText = getTextValue(correction.corrected_value, "text") || ""

      // Penalize generic descriptions
      const genericTerms = ["item", "thing", "stuff", "misc", "other"]
      const isGeneric = genericTerms.some((term) =>
        corrText.toLowerCase().includes(term)
      )
      if (isGeneric && corrText.length < 20) {
        score -= 0.2
        notes.push("Corrected description is generic")
      }
      break
  }

  return Math.min(1, Math.max(0, score))
}

/**
 * Helper: Calculate string similarity (simple Levenshtein-based)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()

  // Simple character overlap similarity
  const aChars = new Set(aLower.split(""))
  const bChars = new Set(bLower.split(""))

  let overlap = 0
  for (const char of aChars) {
    if (bChars.has(char)) overlap++
  }

  return overlap / Math.max(aChars.size, bChars.size)
}

/**
 * Helper: Get text value from object
 */
function getTextValue(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key]
  if (typeof value === "string") return value
  return null
}

/**
 * Helper: Check if object has a non-null value for key
 */
function hasValue(obj: Record<string, unknown>, key: string): boolean {
  return obj[key] !== null && obj[key] !== undefined
}

/**
 * Score a batch of corrections
 */
export function scoreBatch(
  corrections: Array<{
    id: string
    correction_type: string
    original_value: Record<string, unknown>
    corrected_value: Record<string, unknown>
    raw_text_snippet?: string | null
    confidence_score_original?: number | null
  }>
): Array<{ id: string; score: QualityScore }> {
  return corrections.map((correction) => ({
    id: correction.id,
    score: scoreCorrection(correction),
  }))
}

/**
 * Filter corrections to only high-quality ones
 */
export function filterHighQuality<T extends { id: string }>(
  corrections: T[],
  scores: Array<{ id: string; score: QualityScore }>
): T[] {
  const highQualityIds = new Set(
    scores.filter((s) => s.score.isHighQuality).map((s) => s.id)
  )

  return corrections.filter((c) => highQualityIds.has(c.id))
}
