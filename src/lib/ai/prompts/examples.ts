import { createClient } from '@/lib/supabase/server'

export interface CorrectionExample {
  trade_type: string
  correction_type: string
  original_value: string | Record<string, unknown>
  corrected_value: string | Record<string, unknown>
  raw_text_snippet?: string
}

/**
 * Fetch approved correction examples for a specific trade type
 */
export async function getTradeExamples(
  tradeType: string,
  limit: number = 5
): Promise<CorrectionExample[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('training_contributions')
      .select('trade_type, correction_type, original_value, corrected_value, raw_text_snippet')
      .eq('trade_type', tradeType)
      .eq('moderation_status', 'approved')
      .order('contributed_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data as CorrectionExample[]
  } catch {
    // Return empty array if fetching fails - prompts work without examples
    return []
  }
}

/**
 * Format examples for inclusion in extraction prompts
 */
export function formatExtractionExamples(examples: CorrectionExample[]): string {
  if (examples.length === 0) return ''

  const descriptionExamples = examples.filter((e) => e.correction_type === 'description')
  const categoryExamples = examples.filter((e) => e.correction_type === 'category')
  const priceExamples = examples.filter((e) => e.correction_type === 'price')

  const sections: string[] = []

  if (descriptionExamples.length > 0) {
    const descItems = descriptionExamples
      .slice(0, 3)
      .map((e) => {
        const original = typeof e.original_value === 'string' ? e.original_value : JSON.stringify(e.original_value)
        const corrected = typeof e.corrected_value === 'string' ? e.corrected_value : JSON.stringify(e.corrected_value)
        return `  - "${original}" → "${corrected}"`
      })
      .join('\n')

    sections.push(`Description corrections (how to standardize wording):\n${descItems}`)
  }

  if (categoryExamples.length > 0) {
    const catItems = categoryExamples
      .slice(0, 3)
      .map((e) => {
        const original = typeof e.original_value === 'string' ? e.original_value : JSON.stringify(e.original_value)
        const corrected = typeof e.corrected_value === 'string' ? e.corrected_value : JSON.stringify(e.corrected_value)
        return `  - "${original}" should be categorized as "${corrected}"`
      })
      .join('\n')

    sections.push(`Category corrections:\n${catItems}`)
  }

  if (priceExamples.length > 0) {
    const priceItems = priceExamples
      .slice(0, 2)
      .map((e) => {
        const context = e.raw_text_snippet ? ` (from: "${e.raw_text_snippet.slice(0, 100)}...")` : ''
        return `  - Watch for ambiguous pricing formats${context}`
      })
      .join('\n')

    sections.push(`Price extraction notes:\n${priceItems}`)
  }

  if (sections.length === 0) return ''

  return `
LEARNED CORRECTIONS FOR THIS TRADE TYPE:
Based on reviewed corrections from past analyses:

${sections.join('\n\n')}

Apply these patterns when extracting similar items.
`
}

/**
 * Format examples for inclusion in normalization prompts
 */
export function formatNormalizationExamples(examples: CorrectionExample[]): string {
  if (examples.length === 0) return ''

  const descriptionExamples = examples.filter((e) => e.correction_type === 'description')

  if (descriptionExamples.length === 0) return ''

  const matchingPatterns = descriptionExamples
    .slice(0, 5)
    .map((e) => {
      const original = typeof e.original_value === 'string' ? e.original_value : JSON.stringify(e.original_value)
      const corrected = typeof e.corrected_value === 'string' ? e.corrected_value : JSON.stringify(e.corrected_value)
      return `  - "${original}" normalizes to "${corrected}"`
    })
    .join('\n')

  return `
LEARNED NORMALIZATION PATTERNS FOR THIS TRADE:
Apply these standard naming conventions:

${matchingPatterns}

Use these as reference for normalizing similar scope items.
`
}

/**
 * Get common extraction errors for a trade type
 */
export async function getCommonExtractionErrors(
  tradeType: string
): Promise<{ pattern: string; frequency: number }[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('training_contributions')
      .select('correction_type, original_value')
      .eq('trade_type', tradeType)
      .eq('moderation_status', 'approved')

    if (error || !data) {
      return []
    }

    // Count correction patterns
    const patterns = new Map<string, number>()

    for (const contribution of data) {
      const key = `${contribution.correction_type}:${typeof contribution.original_value === 'string' ? contribution.original_value.slice(0, 50) : 'obj'}`
      patterns.set(key, (patterns.get(key) || 0) + 1)
    }

    return Array.from(patterns.entries())
      .map(([pattern, frequency]) => ({ pattern, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  } catch {
    return []
  }
}
