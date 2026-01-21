import { createClient } from "@/lib/supabase/server"
import { generateEmbedding } from "./embedder"

export interface CorrectionExample {
  id: string
  tradeType: string
  correctionType: string
  embeddedText: string
  similarity: number
  isHighQuality: boolean
}

/**
 * Retrieve similar corrections using vector similarity search
 *
 * Note: Requires pgvector extension to be enabled in Supabase
 * and the hnsw index to be created on correction_embeddings.embedding
 */
export async function retrieveSimilarCorrections(
  tradeType: string,
  queryText: string,
  apiKey: string,
  limit: number = 5,
  highQualityOnly: boolean = true
): Promise<CorrectionExample[]> {
  try {
    const supabase = await createClient()

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText, apiKey)

    // Use Supabase's vector similarity search
    // This requires the pgvector extension and a similarity function
    const { data, error } = await supabase.rpc("match_corrections", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      match_trade_type: tradeType,
      match_count: limit,
      high_quality_only: highQualityOnly,
    })

    if (error) {
      // If the RPC doesn't exist, fall back to simpler query
      if (error.message.includes("function") || error.message.includes("does not exist")) {
        console.warn("[Retriever] match_corrections RPC not found, falling back to basic query")
        return await fallbackRetrieval(tradeType, limit, highQualityOnly)
      }

      console.error("[Retriever] Error in similarity search:", error.message)
      return []
    }

    return (data || []).map((row: {
      id: string
      trade_type: string
      correction_type: string
      embedded_text: string
      similarity: number
      is_high_quality: boolean
    }) => ({
      id: row.id,
      tradeType: row.trade_type,
      correctionType: row.correction_type,
      embeddedText: row.embedded_text,
      similarity: row.similarity,
      isHighQuality: row.is_high_quality,
    }))
  } catch (error) {
    console.error("[Retriever] Error:", error)
    return []
  }
}

/**
 * Fallback retrieval without vector similarity (for when pgvector is not available)
 */
async function fallbackRetrieval(
  tradeType: string,
  limit: number,
  highQualityOnly: boolean
): Promise<CorrectionExample[]> {
  const supabase = await createClient()

  let query = supabase
    .from("correction_embeddings")
    .select("id, trade_type, correction_type, embedded_text, is_high_quality")
    .eq("trade_type", tradeType)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (highQualityOnly) {
    query = query.eq("is_high_quality", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("[Retriever] Fallback query error:", error.message)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    tradeType: row.trade_type,
    correctionType: row.correction_type,
    embeddedText: row.embedded_text,
    similarity: 0, // No similarity score in fallback
    isHighQuality: row.is_high_quality,
  }))
}

/**
 * Format retrieved examples for injection into prompts
 */
export function formatRetrievedExamples(examples: CorrectionExample[]): string {
  if (examples.length === 0) return ""

  const formattedExamples = examples
    .slice(0, 5)
    .map((ex, i) => `Example ${i + 1} (${ex.correctionType}):\n${ex.embeddedText}`)
    .join("\n\n")

  return `
SIMILAR CORRECTIONS FROM PAST ANALYSES:
The following examples show corrections made to similar items:

${formattedExamples}

Apply these patterns when extracting similar items.
`
}

/**
 * Get embedding statistics for monitoring
 */
export async function getEmbeddingStats(): Promise<{
  totalEmbeddings: number
  embeddingsByTrade: Record<string, number>
  highQualityCount: number
}> {
  const supabase = await createClient()

  const { data: total } = await supabase
    .from("correction_embeddings")
    .select("id", { count: "exact" })

  const { data: highQuality } = await supabase
    .from("correction_embeddings")
    .select("id", { count: "exact" })
    .eq("is_high_quality", true)

  const { data: byTrade } = await supabase
    .from("correction_embeddings")
    .select("trade_type")

  const embeddingsByTrade: Record<string, number> = {}
  for (const row of byTrade || []) {
    embeddingsByTrade[row.trade_type] = (embeddingsByTrade[row.trade_type] || 0) + 1
  }

  return {
    totalEmbeddings: total?.length || 0,
    embeddingsByTrade,
    highQualityCount: highQuality?.length || 0,
  }
}
