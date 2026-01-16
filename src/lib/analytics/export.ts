import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Training data export utilities for fine-tuning.
 * Exports approved corrections in formats suitable for OpenAI fine-tuning.
 */

export interface FineTuningMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface FineTuningExample {
  messages: FineTuningMessage[]
}

export interface ExportStats {
  total_exported: number
  by_trade: Record<string, number>
  by_correction_type: Record<string, number>
}

/**
 * Get the system prompt for a specific trade type and correction type
 */
function getSystemPrompt(tradeType: string, correctionType: string): string {
  const basePrompts: Record<string, string> = {
    description: `You are an AI assistant that extracts scope item descriptions from ${tradeType} subcontractor bid documents. Extract clear, standardized descriptions that can be compared across multiple bids.`,
    category: `You are an AI assistant that categorizes scope items from ${tradeType} subcontractor bid documents into standard categories. Assign the most appropriate category for each item.`,
    price: `You are an AI assistant that extracts pricing information from ${tradeType} subcontractor bid documents. Identify unit prices, quantities, and total prices accurately.`,
    exclusion_flag: `You are an AI assistant that identifies exclusions and inclusions in ${tradeType} subcontractor bid documents. Determine whether each scope item is included in or excluded from the base bid.`,
    quantity: `You are an AI assistant that extracts quantities from ${tradeType} subcontractor bid documents. Identify the numeric quantity and unit of measure for each scope item.`,
    unit: `You are an AI assistant that identifies units of measure from ${tradeType} subcontractor bid documents. Extract the standard unit (LF, SF, EA, LS, etc.) for each scope item.`,
  }

  return basePrompts[correctionType] || `You are an AI assistant that processes ${tradeType} subcontractor bid documents.`
}

/**
 * Format a correction as a user prompt
 */
function formatUserPrompt(
  rawText: string | null,
  originalValue: Record<string, unknown>,
  correctionType: string
): string {
  const context = rawText ? `Source text: "${rawText}"\n\n` : ''

  const prompts: Record<string, string> = {
    description: `${context}Original extraction: "${originalValue.text || originalValue.description || ''}"

Please provide the corrected description for this scope item.`,
    category: `${context}Scope item: "${originalValue.description || ''}"
Original category: "${originalValue.value || originalValue.category || ''}"

Please provide the correct category for this scope item.`,
    price: `${context}Original extraction:
- Total price: ${originalValue.total_price ?? 'not found'}
- Unit price: ${originalValue.unit_price ?? 'not found'}

Please provide the corrected pricing information.`,
    exclusion_flag: `${context}Scope item: "${originalValue.description || ''}"
Original classification: ${originalValue.value ? 'Exclusion' : 'Inclusion'}

Is this item an exclusion or inclusion? Please correct if needed.`,
    quantity: `${context}Original quantity: ${originalValue.value ?? 'not found'}

Please provide the correct quantity for this scope item.`,
    unit: `${context}Original unit: "${originalValue.value || ''}"

Please provide the correct unit of measure for this scope item.`,
  }

  return prompts[correctionType] || `Please correct this extraction:\n${JSON.stringify(originalValue, null, 2)}`
}

/**
 * Format a corrected value as the assistant response
 */
function formatAssistantResponse(
  correctedValue: Record<string, unknown>,
  correctionType: string
): string {
  switch (correctionType) {
    case 'description':
      return String(correctedValue.text || correctedValue.description || '')
    case 'category':
      return String(correctedValue.value || correctedValue.category || '')
    case 'price':
      return JSON.stringify({
        total_price: correctedValue.total_price,
        unit_price: correctedValue.unit_price,
      })
    case 'exclusion_flag':
      return correctedValue.value ? 'This is an EXCLUSION' : 'This is an INCLUSION'
    case 'quantity':
      return String(correctedValue.value ?? '')
    case 'unit':
      return String(correctedValue.value || correctedValue.unit || '')
    default:
      return JSON.stringify(correctedValue)
  }
}

/**
 * Export approved training contributions as JSONL for fine-tuning
 */
export async function exportTrainingDataAsJSONL(
  supabase: SupabaseClient,
  options: {
    minConfidence?: number
    tradeTypes?: string[]
    correctionTypes?: string[]
    limit?: number
  } = {}
): Promise<{ jsonl: string; stats: ExportStats }> {
  const { minConfidence, tradeTypes, correctionTypes, limit = 10000 } = options

  let query = supabase
    .from('training_contributions')
    .select('*')
    .eq('moderation_status', 'approved')
    .order('contributed_at', { ascending: false })
    .limit(limit)

  if (tradeTypes && tradeTypes.length > 0) {
    query = query.in('trade_type', tradeTypes)
  }

  if (correctionTypes && correctionTypes.length > 0) {
    query = query.in('correction_type', correctionTypes)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error fetching training data:', error)
    return { jsonl: '', stats: { total_exported: 0, by_trade: {}, by_correction_type: {} } }
  }

  // Filter by confidence if specified
  const filtered = minConfidence
    ? data.filter((d) => d.confidence_score_original === null || d.confidence_score_original <= minConfidence)
    : data

  // Convert to fine-tuning format
  const examples: FineTuningExample[] = filtered.map((contribution) => ({
    messages: [
      {
        role: 'system' as const,
        content: getSystemPrompt(contribution.trade_type, contribution.correction_type),
      },
      {
        role: 'user' as const,
        content: formatUserPrompt(
          contribution.raw_text_snippet,
          contribution.original_value as Record<string, unknown>,
          contribution.correction_type
        ),
      },
      {
        role: 'assistant' as const,
        content: formatAssistantResponse(
          contribution.corrected_value as Record<string, unknown>,
          contribution.correction_type
        ),
      },
    ],
  }))

  // Generate JSONL
  const jsonl = examples.map((ex) => JSON.stringify(ex)).join('\n')

  // Calculate stats
  const stats: ExportStats = {
    total_exported: examples.length,
    by_trade: filtered.reduce((acc, d) => {
      acc[d.trade_type] = (acc[d.trade_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    by_correction_type: filtered.reduce((acc, d) => {
      acc[d.correction_type] = (acc[d.correction_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  return { jsonl, stats }
}

/**
 * Export training data as a structured JSON array (for analysis/review)
 */
export async function exportTrainingDataAsJSON(
  supabase: SupabaseClient,
  options: {
    status?: 'pending' | 'approved' | 'rejected' | 'all'
    tradeTypes?: string[]
    limit?: number
  } = {}
): Promise<unknown[]> {
  const { status = 'approved', tradeTypes, limit = 1000 } = options

  let query = supabase
    .from('training_contributions')
    .select('*')
    .order('contributed_at', { ascending: false })
    .limit(limit)

  if (status !== 'all') {
    query = query.eq('moderation_status', status)
  }

  if (tradeTypes && tradeTypes.length > 0) {
    query = query.in('trade_type', tradeTypes)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error fetching training data:', error)
    return []
  }

  return data
}

/**
 * Get export-ready correction examples for specific prompt improvements
 * Groups corrections by trade type and correction type for targeted prompt updates
 */
export async function getPromptImprovementExamples(
  supabase: SupabaseClient,
  tradeType: string,
  correctionType: string,
  limit: number = 10
): Promise<Array<{
  original: Record<string, unknown>
  corrected: Record<string, unknown>
  rawText: string | null
  notes: string | null
}>> {
  const { data, error } = await supabase
    .from('training_contributions')
    .select('original_value, corrected_value, raw_text_snippet, ai_notes')
    .eq('trade_type', tradeType)
    .eq('correction_type', correctionType)
    .eq('moderation_status', 'approved')
    .order('contributed_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error('Error fetching prompt examples:', error)
    return []
  }

  return data.map((d) => ({
    original: d.original_value as Record<string, unknown>,
    corrected: d.corrected_value as Record<string, unknown>,
    rawText: d.raw_text_snippet,
    notes: d.ai_notes,
  }))
}
