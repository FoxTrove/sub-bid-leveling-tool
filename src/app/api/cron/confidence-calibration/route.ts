import { NextResponse } from "next/server"
import { calibrateAllTrades } from "@/lib/ai/calibration/calculator"

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

/**
 * Confidence Calibration Cron Job
 *
 * Recalculates confidence thresholds per trade based on correction patterns.
 * Trades with high correction rates at "high confidence" get stricter thresholds.
 *
 * Schedule: Weekly on Sunday at 3:00 AM (configure in vercel.json or similar)
 *
 * Example vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/confidence-calibration",
 *     "schedule": "0 3 * * 0"
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

  console.log("[ConfidenceCalibration] Starting calibration cron job")

  try {
    const { results, summary } = await calibrateAllTrades()

    console.log(
      `[ConfidenceCalibration] Complete. Updated: ${summary.tradesUpdated}, Skipped: ${summary.tradesSkipped}`
    )

    // Log threshold changes
    const updatedTrades = results.filter((r) => r.wasUpdated)
    for (const trade of updatedTrades) {
      console.log(
        `[ConfidenceCalibration] ${trade.tradeType}: ` +
          `low ${trade.currentLowThreshold} -> ${trade.suggestedLowThreshold}, ` +
          `medium ${trade.currentMediumThreshold} -> ${trade.suggestedMediumThreshold}`
      )
    }

    return NextResponse.json({
      success: true,
      summary,
      updatedTrades: updatedTrades.map((t) => ({
        tradeType: t.tradeType,
        oldThresholds: {
          low: t.currentLowThreshold,
          medium: t.currentMediumThreshold,
        },
        newThresholds: {
          low: t.suggestedLowThreshold,
          medium: t.suggestedMediumThreshold,
        },
        totalCorrections: t.totalCorrections,
      })),
    })
  } catch (error) {
    console.error("[ConfidenceCalibration] Error:", error)
    return NextResponse.json(
      {
        error: "Calibration failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
