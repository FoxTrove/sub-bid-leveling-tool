/**
 * Export Manager for Fine-Tuning Preparation
 *
 * Generates JSONL datasets in OpenAI fine-tuning format from
 * high-quality corrections. Tracks export history for versioning.
 */

import { createClient } from "@/lib/supabase/server"
import { scoreBatch, filterHighQuality, QualityScore } from "./quality-scorer"

export interface ExportConfig {
  minQualityScore: number // Minimum quality score (default 0.8)
  maxExamples: number // Maximum examples to export
  tradeTypes?: string[] // Filter by trade types (optional)
  correctionTypes?: string[] // Filter by correction types (optional)
  includeMetadata: boolean // Include metadata in JSONL
}

export interface FineTuningExample {
  messages: Array<{
    role: "system" | "user" | "assistant"
    content: string
  }>
}

export interface ExportResult {
  exportId: string
  totalExamples: number
  byTradeType: Record<string, number>
  byCorrectionType: Record<string, number>
  avgQualityScore: number
  jsonlContent: string
  createdAt: Date
}

export interface ExportStats {
  totalExports: number
  totalExamplesExported: number
  lastExportAt: Date | null
  readinessStatus: {
    isReady: boolean
    currentCount: number
    targetCount: number
    percentComplete: number
  }
}

const DEFAULT_CONFIG: ExportConfig = {
  minQualityScore: 0.8,
  maxExamples: 10000,
  includeMetadata: false,
}

/**
 * Generate fine-tuning JSONL from approved corrections
 */
export async function generateFineTuningExport(
  config: Partial<ExportConfig> = {}
): Promise<ExportResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const supabase = await createClient()

  // Build query for approved corrections
  let query = supabase
    .from("training_contributions")
    .select(
      `
      id,
      trade_type,
      correction_type,
      original_value,
      corrected_value,
      raw_text_snippet,
      confidence_score_original,
      created_at
    `
    )
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(finalConfig.maxExamples * 2) // Fetch extra to account for filtering

  // Apply trade type filter
  if (finalConfig.tradeTypes && finalConfig.tradeTypes.length > 0) {
    query = query.in("trade_type", finalConfig.tradeTypes)
  }

  // Apply correction type filter
  if (finalConfig.correctionTypes && finalConfig.correctionTypes.length > 0) {
    query = query.in("correction_type", finalConfig.correctionTypes)
  }

  const { data: corrections, error } = await query

  if (error) {
    throw new Error(`Failed to fetch corrections: ${error.message}`)
  }

  if (!corrections || corrections.length === 0) {
    throw new Error("No approved corrections found for export")
  }

  // Score corrections for quality
  const scores = scoreBatch(
    corrections.map((c) => ({
      id: c.id,
      correction_type: c.correction_type,
      original_value: c.original_value as Record<string, unknown>,
      corrected_value: c.corrected_value as Record<string, unknown>,
      raw_text_snippet: c.raw_text_snippet,
      confidence_score_original: c.confidence_score_original,
    }))
  )

  // Filter to high-quality examples
  const highQualityCorrections = filterHighQuality(corrections, scores)
    .slice(0, finalConfig.maxExamples)

  if (highQualityCorrections.length === 0) {
    throw new Error("No high-quality corrections found for export")
  }

  // Convert to fine-tuning format
  const examples: FineTuningExample[] = highQualityCorrections.map((correction) =>
    convertToFineTuningFormat(correction, finalConfig.includeMetadata)
  )

  // Generate JSONL
  const jsonlContent = examples.map((ex) => JSON.stringify(ex)).join("\n")

  // Calculate statistics
  const scoreMap = new Map(scores.map((s) => [s.id, s.score]))
  const avgQualityScore =
    highQualityCorrections.reduce(
      (sum, c) => sum + (scoreMap.get(c.id)?.score || 0),
      0
    ) / highQualityCorrections.length

  const byTradeType: Record<string, number> = {}
  const byCorrectionType: Record<string, number> = {}

  for (const correction of highQualityCorrections) {
    byTradeType[correction.trade_type] =
      (byTradeType[correction.trade_type] || 0) + 1
    byCorrectionType[correction.correction_type] =
      (byCorrectionType[correction.correction_type] || 0) + 1
  }

  // Record export in database
  const { data: exportRecord, error: insertError } = await supabase
    .from("fine_tuning_exports")
    .insert({
      total_examples: highQualityCorrections.length,
      by_trade_type: byTradeType,
      by_correction_type: byCorrectionType,
      avg_quality_score: avgQualityScore,
      config: finalConfig,
    })
    .select("id, created_at")
    .single()

  if (insertError) {
    console.error("[ExportManager] Failed to record export:", insertError.message)
  }

  return {
    exportId: exportRecord?.id || crypto.randomUUID(),
    totalExamples: highQualityCorrections.length,
    byTradeType,
    byCorrectionType,
    avgQualityScore: Math.round(avgQualityScore * 100) / 100,
    jsonlContent,
    createdAt: exportRecord?.created_at ? new Date(exportRecord.created_at) : new Date(),
  }
}

/**
 * Convert a correction to OpenAI fine-tuning format
 */
function convertToFineTuningFormat(
  correction: {
    trade_type: string
    correction_type: string
    original_value: unknown
    corrected_value: unknown
    raw_text_snippet?: string | null
  },
  includeMetadata: boolean
): FineTuningExample {
  const systemPrompt = buildSystemPrompt(correction.trade_type, correction.correction_type)
  const userMessage = buildUserMessage(correction)
  const assistantMessage = buildAssistantMessage(correction)

  const example: FineTuningExample = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantMessage },
    ],
  }

  if (includeMetadata) {
    // Add metadata as a comment in system prompt
    example.messages[0].content = `${systemPrompt}\n\n[Metadata: trade=${correction.trade_type}, type=${correction.correction_type}]`
  }

  return example
}

/**
 * Build system prompt for fine-tuning example
 */
function buildSystemPrompt(tradeType: string, correctionType: string): string {
  const basePrompt = `You are an expert construction bid analyst specializing in ${tradeType} work. Your task is to accurately extract and normalize bid information from subcontractor documents.`

  const typeSpecificPrompts: Record<string, string> = {
    description: `Focus on extracting clear, standardized descriptions of line items that capture the full scope of work.`,
    category: `Accurately categorize line items according to standard construction divisions and work types.`,
    price: `Extract and validate pricing information, ensuring all costs are captured correctly.`,
    quantity: `Extract quantities with appropriate precision and units.`,
    unit: `Identify and standardize units of measurement.`,
    exclusion_flag: `Identify items that are explicitly excluded from the bid scope.`,
  }

  return `${basePrompt} ${typeSpecificPrompts[correctionType] || ""}`
}

/**
 * Build user message from correction context
 */
function buildUserMessage(correction: {
  original_value: unknown
  raw_text_snippet?: string | null
}): string {
  const parts: string[] = []

  if (correction.raw_text_snippet) {
    parts.push(`Extract information from the following bid text:\n\n${correction.raw_text_snippet}`)
  }

  const origValue = correction.original_value as Record<string, unknown>
  if (origValue && Object.keys(origValue).length > 0) {
    parts.push(`\nInitial extraction (may need correction):\n${JSON.stringify(origValue, null, 2)}`)
  }

  return parts.join("\n") || "Extract and validate the bid information."
}

/**
 * Build assistant message from corrected value
 */
function buildAssistantMessage(correction: {
  correction_type: string
  corrected_value: unknown
}): string {
  const corrValue = correction.corrected_value as Record<string, unknown>

  switch (correction.correction_type) {
    case "description":
      return corrValue.text as string || JSON.stringify(corrValue)
    case "category":
      return corrValue.value as string || JSON.stringify(corrValue)
    case "price":
      return `Total price: ${corrValue.total_price}`
    case "quantity":
      return `Quantity: ${corrValue.value}`
    case "unit":
      return `Unit: ${corrValue.value}`
    case "exclusion_flag":
      return corrValue.value ? "This item is EXCLUDED from the bid scope." : "This item is INCLUDED in the bid scope."
    default:
      return JSON.stringify(corrValue)
  }
}

/**
 * Get export statistics and readiness status
 */
export async function getExportStats(): Promise<ExportStats> {
  const supabase = await createClient()

  // Get total approved corrections
  const { count: totalApproved } = await supabase
    .from("training_contributions")
    .select("id", { count: "exact" })
    .eq("moderation_status", "approved")

  // Get export history
  const { data: exports } = await supabase
    .from("fine_tuning_exports")
    .select("id, total_examples, created_at")
    .order("created_at", { ascending: false })

  const totalExports = exports?.length || 0
  const totalExamplesExported = exports?.reduce((sum, e) => sum + (e.total_examples || 0), 0) || 0
  const lastExportAt = exports?.[0]?.created_at ? new Date(exports[0].created_at) : null

  // Calculate readiness (target: 1000 high-quality examples)
  const TARGET_COUNT = 1000
  const currentCount = totalApproved || 0

  return {
    totalExports,
    totalExamplesExported,
    lastExportAt,
    readinessStatus: {
      isReady: currentCount >= TARGET_COUNT,
      currentCount,
      targetCount: TARGET_COUNT,
      percentComplete: Math.min(100, Math.round((currentCount / TARGET_COUNT) * 100)),
    },
  }
}

/**
 * Get detailed quality distribution for corrections
 */
export async function getQualityDistribution(): Promise<{
  total: number
  highQuality: number
  mediumQuality: number
  lowQuality: number
  byTradeType: Record<string, { total: number; highQuality: number }>
}> {
  const supabase = await createClient()

  const { data: corrections } = await supabase
    .from("training_contributions")
    .select(
      "id, trade_type, correction_type, original_value, corrected_value, raw_text_snippet, confidence_score_original"
    )
    .eq("moderation_status", "approved")

  if (!corrections || corrections.length === 0) {
    return {
      total: 0,
      highQuality: 0,
      mediumQuality: 0,
      lowQuality: 0,
      byTradeType: {},
    }
  }

  // Score all corrections
  const scores = scoreBatch(
    corrections.map((c) => ({
      id: c.id,
      correction_type: c.correction_type,
      original_value: c.original_value as Record<string, unknown>,
      corrected_value: c.corrected_value as Record<string, unknown>,
      raw_text_snippet: c.raw_text_snippet,
      confidence_score_original: c.confidence_score_original,
    }))
  )

  const scoreMap = new Map(scores.map((s) => [s.id, s.score]))

  let highQuality = 0
  let mediumQuality = 0
  let lowQuality = 0
  const byTradeType: Record<string, { total: number; highQuality: number }> = {}

  for (const correction of corrections) {
    const score = scoreMap.get(correction.id)?.score || 0

    if (score >= 0.8) highQuality++
    else if (score >= 0.6) mediumQuality++
    else lowQuality++

    if (!byTradeType[correction.trade_type]) {
      byTradeType[correction.trade_type] = { total: 0, highQuality: 0 }
    }
    byTradeType[correction.trade_type].total++
    if (score >= 0.8) {
      byTradeType[correction.trade_type].highQuality++
    }
  }

  return {
    total: corrections.length,
    highQuality,
    mediumQuality,
    lowQuality,
    byTradeType,
  }
}

/**
 * Validate JSONL format for OpenAI fine-tuning
 */
export function validateJsonlFormat(jsonlContent: string): {
  isValid: boolean
  errors: string[]
  exampleCount: number
} {
  const errors: string[] = []
  const lines = jsonlContent.split("\n").filter((line) => line.trim())

  for (let i = 0; i < lines.length; i++) {
    try {
      const example = JSON.parse(lines[i])

      // Check required structure
      if (!example.messages || !Array.isArray(example.messages)) {
        errors.push(`Line ${i + 1}: Missing or invalid 'messages' array`)
        continue
      }

      // Check message roles
      const roles = example.messages.map((m: { role: string }) => m.role)
      if (!roles.includes("system") && !roles.includes("user")) {
        errors.push(`Line ${i + 1}: Missing system or user message`)
      }
      if (!roles.includes("assistant")) {
        errors.push(`Line ${i + 1}: Missing assistant message`)
      }

      // Check message content
      for (let j = 0; j < example.messages.length; j++) {
        const msg = example.messages[j]
        if (!msg.content || typeof msg.content !== "string") {
          errors.push(`Line ${i + 1}, Message ${j + 1}: Invalid or missing content`)
        }
      }
    } catch {
      errors.push(`Line ${i + 1}: Invalid JSON`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    exampleCount: lines.length,
  }
}
