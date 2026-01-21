import { NextResponse } from "next/server"
import { processCorrectionBatch } from "@/lib/ai/rag/embedder"
import { getEmbeddingStats } from "@/lib/ai/rag/retriever"

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

/**
 * Embeddings Generation Cron Job
 *
 * Processes approved corrections and generates vector embeddings for RAG retrieval.
 * Runs every 15 minutes to keep embeddings up to date.
 *
 * Schedule: Every 15 minutes (configure in vercel.json or similar)
 *
 * Example vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-embeddings",
 *     "schedule": "* /15 * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const providedSecret = authHeader?.replace("Bearer ", "")

  if (CRON_SECRET && providedSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    )
  }

  console.log("[GenerateEmbeddings] Starting embeddings generation cron job")

  try {
    // Process a batch of corrections
    const batchSize = 100
    const result = await processCorrectionBatch(OPENAI_API_KEY, batchSize)

    // Get current stats
    const stats = await getEmbeddingStats()

    console.log(
      `[GenerateEmbeddings] Complete. Processed: ${result.processed}, Errors: ${result.errors}`
    )

    return NextResponse.json({
      success: true,
      batch: {
        processed: result.processed,
        errors: result.errors,
        batchSize,
      },
      stats: {
        totalEmbeddings: stats.totalEmbeddings,
        highQualityCount: stats.highQualityCount,
        byTrade: stats.embeddingsByTrade,
      },
    })
  } catch (error) {
    console.error("[GenerateEmbeddings] Error:", error)
    return NextResponse.json(
      {
        error: "Embeddings generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
