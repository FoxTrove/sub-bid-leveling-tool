import { createClient } from "@/lib/supabase/server"

export interface Pattern {
  patternKey: string
  patternValue: {
    from: string
    to: string
    context?: string
  }
  refinementType: string
  occurrenceCount: number
}

/**
 * Fetch active patterns for a trade type from the database
 */
export async function getActivePatterns(
  tradeType: string,
  limit: number = 10
): Promise<Pattern[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("get_active_patterns", {
      p_trade_type: tradeType,
      p_limit: limit,
    })

    if (error || !data) {
      console.error("[PatternInjector] Failed to fetch patterns:", error?.message)
      return []
    }

    return data.map((row: {
      pattern_key: string
      pattern_value: { from: string; to: string; context?: string }
      refinement_type: string
      occurrence_count: number
    }) => ({
      patternKey: row.pattern_key,
      patternValue: row.pattern_value,
      refinementType: row.refinement_type,
      occurrenceCount: row.occurrence_count,
    }))
  } catch (error) {
    console.error("[PatternInjector] Error fetching patterns:", error)
    return []
  }
}

/**
 * Format active patterns as a prompt section for injection
 */
export function formatPatternSection(patterns: Pattern[]): string {
  if (patterns.length === 0) return ""

  const terminologyPatterns = patterns.filter(
    (p) => p.refinementType === "terminology"
  )
  const categoryPatterns = patterns.filter(
    (p) => p.refinementType === "category_rule"
  )
  const extractionPatterns = patterns.filter(
    (p) => p.refinementType === "extraction_rule"
  )

  const sections: string[] = []

  if (terminologyPatterns.length > 0) {
    const items = terminologyPatterns
      .slice(0, 5)
      .map(
        (p) =>
          `  - "${p.patternValue.from}" should be written as "${p.patternValue.to}"`
      )
      .join("\n")

    sections.push(`Standard terminology for this trade:\n${items}`)
  }

  if (categoryPatterns.length > 0) {
    const items = categoryPatterns
      .slice(0, 5)
      .map(
        (p) =>
          `  - Items like "${p.patternValue.from}" belong in category "${p.patternValue.to}"`
      )
      .join("\n")

    sections.push(`Category assignment rules:\n${items}`)
  }

  if (extractionPatterns.length > 0) {
    const items = extractionPatterns
      .slice(0, 3)
      .map((p) => `  - ${p.patternValue.context || `${p.patternValue.from} -> ${p.patternValue.to}`}`)
      .join("\n")

    sections.push(`Extraction rules:\n${items}`)
  }

  if (sections.length === 0) return ""

  return `
LEARNED PATTERNS FOR THIS TRADE:
Based on patterns from verified corrections:

${sections.join("\n\n")}

Apply these patterns when extracting and categorizing items.
`
}

/**
 * Get formatted pattern section for a trade type
 * Convenience function that combines fetch and format
 */
export async function getPatternPromptSection(
  tradeType: string,
  limit: number = 10
): Promise<string> {
  const patterns = await getActivePatterns(tradeType, limit)
  return formatPatternSection(patterns)
}
