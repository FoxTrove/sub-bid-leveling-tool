import { NextResponse } from "next/server"
import { runPatternAnalysis } from "@/lib/ai/patterns/analyzer"
import { TRADE_TYPES } from "@/types"

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Pattern Analysis Cron Job
 *
 * Analyzes approved training contributions to extract repeating patterns.
 * Patterns with 10+ occurrences are auto-promoted to active status.
 *
 * Schedule: Daily at 2:00 AM (configure in vercel.json or similar)
 *
 * Example vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/pattern-analysis",
 *     "schedule": "0 2 * * *"
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

  console.log("[PatternAnalysis] Starting pattern analysis cron job")

  try {
    const results: Record<
      string,
      { analyzed: number; inserted: number; updated: number; promoted: number }
    > = {}

    let totalAnalyzed = 0
    let totalInserted = 0
    let totalUpdated = 0
    let totalPromoted = 0

    // Analyze patterns for each trade type
    for (const tradeType of TRADE_TYPES) {
      const result = await runPatternAnalysis(tradeType)

      if (result.analyzed > 0) {
        results[tradeType] = result
        totalAnalyzed += result.analyzed
        totalInserted += result.inserted
        totalUpdated += result.updated
        totalPromoted += result.promoted
      }
    }

    console.log(
      `[PatternAnalysis] Complete. Analyzed: ${totalAnalyzed}, Inserted: ${totalInserted}, Updated: ${totalUpdated}, Promoted: ${totalPromoted}`
    )

    return NextResponse.json({
      success: true,
      summary: {
        totalAnalyzed,
        totalInserted,
        totalUpdated,
        totalPromoted,
        tradesProcessed: Object.keys(results).length,
      },
      byTrade: results,
    })
  } catch (error) {
    console.error("[PatternAnalysis] Error:", error)
    return NextResponse.json(
      {
        error: "Pattern analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
