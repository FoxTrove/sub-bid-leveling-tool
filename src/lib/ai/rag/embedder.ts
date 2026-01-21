import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const EMBEDDING_MODEL = "text-embedding-3-small"
const EMBEDDING_DIMENSION = 1536

/**
 * Generate embedding text from a correction for semantic search
 */
export function generateEmbeddingText(correction: {
  trade_type: string
  correction_type: string
  original_value: Record<string, unknown>
  corrected_value: Record<string, unknown>
  raw_text_snippet?: string | null
}): string {
  const parts: string[] = []

  // Add trade context
  parts.push(`Trade: ${correction.trade_type}`)
  parts.push(`Correction type: ${correction.correction_type}`)

  // Add original value context
  switch (correction.correction_type) {
    case "description":
      const origDesc = getTextValue(correction.original_value, "text")
      const corrDesc = getTextValue(correction.corrected_value, "text")
      if (origDesc) parts.push(`Original: ${origDesc}`)
      if (corrDesc) parts.push(`Corrected to: ${corrDesc}`)
      break

    case "category":
      const origCat = getTextValue(correction.original_value, "value")
      const corrCat = getTextValue(correction.corrected_value, "value")
      if (origCat) parts.push(`Original category: ${origCat}`)
      if (corrCat) parts.push(`Corrected category: ${corrCat}`)
      break

    case "price":
      const origPrice = correction.original_value.total_price
      const corrPrice = correction.corrected_value.total_price
      if (origPrice !== undefined) parts.push(`Original price: ${origPrice}`)
      if (corrPrice !== undefined) parts.push(`Corrected price: ${corrPrice}`)
      break

    case "exclusion_flag":
      const origFlag = correction.original_value.value
      const corrFlag = correction.corrected_value.value
      parts.push(
        `Exclusion flag: ${origFlag ? "excluded" : "included"} -> ${corrFlag ? "excluded" : "included"}`
      )
      break

    case "quantity":
    case "unit":
      const origVal = getTextValue(correction.original_value, "value")
      const corrVal = getTextValue(correction.corrected_value, "value")
      if (origVal) parts.push(`Original ${correction.correction_type}: ${origVal}`)
      if (corrVal) parts.push(`Corrected ${correction.correction_type}: ${corrVal}`)
      break
  }

  // Add raw text context if available
  if (correction.raw_text_snippet) {
    parts.push(`Context: ${correction.raw_text_snippet.slice(0, 200)}`)
  }

  return parts.join("\n")
}

/**
 * Get text value from an object, handling various formats
 */
function getTextValue(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key]
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return null
}

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const openai = new OpenAI({ apiKey })

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSION,
  })

  return response.data[0].embedding
}

/**
 * Store embedding in the database
 */
export async function storeEmbedding(
  contributionId: string,
  tradeType: string,
  correctionType: string,
  embeddedText: string,
  embedding: number[],
  qualityScore?: number
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("correction_embeddings").insert({
      contribution_id: contributionId,
      trade_type: tradeType,
      correction_type: correctionType,
      embedded_text: embeddedText,
      embedding: `[${embedding.join(",")}]`, // pgvector format
      quality_score: qualityScore ?? null,
      is_high_quality: qualityScore !== undefined && qualityScore >= 0.8,
    })

    if (error) {
      console.error("[Embedder] Error storing embedding:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("[Embedder] Error:", error)
    return false
  }
}

/**
 * Process a batch of corrections and generate embeddings
 */
export async function processCorrectionBatch(
  apiKey: string,
  batchSize: number = 100
): Promise<{ processed: number; errors: number }> {
  const supabase = await createClient()

  // Find approved corrections without embeddings
  const { data: corrections, error: fetchError } = await supabase
    .from("training_contributions")
    .select("id, trade_type, correction_type, original_value, corrected_value, raw_text_snippet")
    .eq("moderation_status", "approved")
    .not(
      "id",
      "in",
      supabase.from("correction_embeddings").select("contribution_id")
    )
    .limit(batchSize)

  if (fetchError) {
    console.error("[Embedder] Error fetching corrections:", fetchError.message)
    return { processed: 0, errors: 0 }
  }

  // Alternative query if the NOT IN subquery doesn't work
  // We'll use a left join approach via separate queries
  const { data: existingEmbeddings } = await supabase
    .from("correction_embeddings")
    .select("contribution_id")

  const existingIds = new Set((existingEmbeddings || []).map((e) => e.contribution_id))

  const { data: allCorrections } = await supabase
    .from("training_contributions")
    .select("id, trade_type, correction_type, original_value, corrected_value, raw_text_snippet")
    .eq("moderation_status", "approved")
    .limit(batchSize * 2) // Fetch more to account for filtering

  const unprocessedCorrections = (allCorrections || [])
    .filter((c) => !existingIds.has(c.id))
    .slice(0, batchSize)

  if (unprocessedCorrections.length === 0) {
    return { processed: 0, errors: 0 }
  }

  let processed = 0
  let errors = 0

  for (const correction of unprocessedCorrections) {
    try {
      // Generate embedding text
      const embeddedText = generateEmbeddingText({
        trade_type: correction.trade_type,
        correction_type: correction.correction_type,
        original_value: correction.original_value as Record<string, unknown>,
        corrected_value: correction.corrected_value as Record<string, unknown>,
        raw_text_snippet: correction.raw_text_snippet,
      })

      // Generate embedding
      const embedding = await generateEmbedding(embeddedText, apiKey)

      // Store embedding
      const success = await storeEmbedding(
        correction.id,
        correction.trade_type,
        correction.correction_type,
        embeddedText,
        embedding
      )

      if (success) {
        processed++
      } else {
        errors++
      }
    } catch (error) {
      console.error(`[Embedder] Error processing correction ${correction.id}:`, error)
      errors++
    }
  }

  return { processed, errors }
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSION }
