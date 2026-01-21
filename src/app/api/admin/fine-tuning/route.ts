import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  generateFineTuningExport,
  getExportStats,
  getQualityDistribution,
  validateJsonlFormat,
} from "@/lib/training/export-manager"

/**
 * Admin API for Fine-Tuning Management
 *
 * GET: View export readiness status and quality distribution
 * POST: Generate fine-tuning dataset
 */

/**
 * GET /api/admin/fine-tuning
 *
 * Returns export readiness status and quality distribution
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify user is authenticated (admin check could be added here)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get export stats and quality distribution in parallel
    const [stats, qualityDistribution] = await Promise.all([
      getExportStats(),
      getQualityDistribution(),
    ])

    return NextResponse.json({
      readiness: stats.readinessStatus,
      exportHistory: {
        totalExports: stats.totalExports,
        totalExamplesExported: stats.totalExamplesExported,
        lastExportAt: stats.lastExportAt?.toISOString() || null,
      },
      quality: {
        total: qualityDistribution.total,
        highQuality: qualityDistribution.highQuality,
        mediumQuality: qualityDistribution.mediumQuality,
        lowQuality: qualityDistribution.lowQuality,
        highQualityPercent:
          qualityDistribution.total > 0
            ? Math.round((qualityDistribution.highQuality / qualityDistribution.total) * 100)
            : 0,
      },
      byTradeType: qualityDistribution.byTradeType,
    })
  } catch (error) {
    console.error("[FineTuning API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to get fine-tuning status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/fine-tuning
 *
 * Generates a fine-tuning dataset
 *
 * Request body:
 * {
 *   minQualityScore?: number,  // Minimum quality score (default 0.8)
 *   maxExamples?: number,       // Maximum examples (default 10000)
 *   tradeTypes?: string[],      // Filter by trades
 *   correctionTypes?: string[], // Filter by correction types
 *   includeMetadata?: boolean,  // Include metadata in output
 *   validateOnly?: boolean      // Just validate, don't save
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      minQualityScore,
      maxExamples,
      tradeTypes,
      correctionTypes,
      includeMetadata,
      validateOnly,
    } = body

    // Generate export
    const result = await generateFineTuningExport({
      minQualityScore,
      maxExamples,
      tradeTypes,
      correctionTypes,
      includeMetadata,
    })

    // Validate the generated JSONL
    const validation = validateJsonlFormat(result.jsonlContent)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Generated JSONL failed validation",
          validationErrors: validation.errors,
        },
        { status: 500 }
      )
    }

    // If validate only, return without content
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        validated: true,
        exportId: result.exportId,
        totalExamples: result.totalExamples,
        byTradeType: result.byTradeType,
        byCorrectionType: result.byCorrectionType,
        avgQualityScore: result.avgQualityScore,
        validation: {
          isValid: validation.isValid,
          exampleCount: validation.exampleCount,
        },
      })
    }

    // Return full export with downloadable content
    return NextResponse.json({
      success: true,
      exportId: result.exportId,
      totalExamples: result.totalExamples,
      byTradeType: result.byTradeType,
      byCorrectionType: result.byCorrectionType,
      avgQualityScore: result.avgQualityScore,
      createdAt: result.createdAt.toISOString(),
      validation: {
        isValid: validation.isValid,
        exampleCount: validation.exampleCount,
      },
      // Include JSONL content for download
      jsonl: result.jsonlContent,
    })
  } catch (error) {
    console.error("[FineTuning API] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate fine-tuning dataset",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
