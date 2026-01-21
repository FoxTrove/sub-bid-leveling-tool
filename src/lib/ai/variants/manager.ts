import { createClient } from "@/lib/supabase/server"

export interface Variant {
  id: string
  name: string
  content: string
  isControl: boolean
}

export type PipelineStage = "extraction" | "normalization" | "recommendation"

/**
 * Select a variant for A/B testing
 * Returns active variant 80% of the time, control 20%
 * Returns null if no variants exist for the trade/stage
 */
export async function selectVariant(
  tradeType: string,
  stage: PipelineStage
): Promise<Variant | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("select_variant", {
      p_trade_type: tradeType,
      p_stage: stage,
    })

    if (error) {
      console.error("[VariantManager] Error selecting variant:", error.message)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const row = data[0]
    return {
      id: row.variant_id,
      name: row.variant_name,
      content: row.variant_content,
      isControl: row.is_control,
    }
  } catch (error) {
    console.error("[VariantManager] Error:", error)
    return null
  }
}

/**
 * Update variant metrics after a pipeline run
 */
export async function updateVariantMetrics(
  variantId: string,
  avgConfidence: number,
  hadCorrection: boolean,
  extractionTimeMs?: number
): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc("update_variant_metrics", {
      p_variant_id: variantId,
      p_confidence: avgConfidence,
      p_had_correction: hadCorrection,
      p_extraction_time_ms: extractionTimeMs || null,
    })

    if (error) {
      console.error("[VariantManager] Error updating metrics:", error.message)
    }
  } catch (error) {
    console.error("[VariantManager] Error:", error)
  }
}

/**
 * Create a new prompt variant
 */
export async function createVariant(
  tradeType: string,
  stage: PipelineStage,
  name: string,
  content: string,
  isControl: boolean = false,
  isActive: boolean = false
): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("prompt_variants")
      .insert({
        trade_type: tradeType,
        pipeline_stage: stage,
        variant_name: name,
        variant_content: content,
        is_control: isControl,
        is_active: isActive,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[VariantManager] Error creating variant:", error.message)
      return null
    }

    return data.id
  } catch (error) {
    console.error("[VariantManager] Error:", error)
    return null
  }
}

/**
 * Activate a variant (deactivates other active variants for same trade/stage)
 */
export async function activateVariant(
  variantId: string,
  tradeType: string,
  stage: PipelineStage
): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Deactivate other active variants
    await supabase
      .from("prompt_variants")
      .update({ is_active: false })
      .eq("trade_type", tradeType)
      .eq("pipeline_stage", stage)
      .eq("is_active", true)
      .neq("id", variantId)

    // Activate the selected variant
    const { error } = await supabase
      .from("prompt_variants")
      .update({ is_active: true })
      .eq("id", variantId)

    if (error) {
      console.error("[VariantManager] Error activating variant:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.error("[VariantManager] Error:", error)
    return false
  }
}

/**
 * Get variant performance comparison for a trade/stage
 */
export async function getVariantPerformance(
  tradeType: string,
  stage: PipelineStage
): Promise<
  Array<{
    id: string
    name: string
    isActive: boolean
    isControl: boolean
    totalRuns: number
    avgConfidence: number | null
    correctionRate: number | null
    avgExtractionTimeMs: number | null
  }>
> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("prompt_variants")
      .select(
        "id, variant_name, is_active, is_control, total_runs, avg_confidence, correction_rate, avg_extraction_time_ms"
      )
      .eq("trade_type", tradeType)
      .eq("pipeline_stage", stage)
      .order("total_runs", { ascending: false })

    if (error) {
      console.error("[VariantManager] Error fetching performance:", error.message)
      return []
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.variant_name,
      isActive: row.is_active,
      isControl: row.is_control,
      totalRuns: row.total_runs,
      avgConfidence: row.avg_confidence,
      correctionRate: row.correction_rate,
      avgExtractionTimeMs: row.avg_extraction_time_ms,
    }))
  } catch (error) {
    console.error("[VariantManager] Error:", error)
    return []
  }
}

/**
 * Automatically promote the best performing variant
 * Based on: highest confidence, lowest correction rate
 */
export async function autoPromoteBestVariant(
  tradeType: string,
  stage: PipelineStage,
  minRuns: number = 50
): Promise<string | null> {
  const variants = await getVariantPerformance(tradeType, stage)

  // Filter to variants with enough runs
  const eligibleVariants = variants.filter(
    (v) => v.totalRuns >= minRuns && !v.isControl
  )

  if (eligibleVariants.length === 0) {
    return null
  }

  // Score variants: higher confidence + lower correction rate = better
  const scored = eligibleVariants.map((v) => ({
    ...v,
    score:
      (v.avgConfidence || 0) * 100 - (v.correctionRate || 0) * 50,
  }))

  // Find best
  const best = scored.reduce((a, b) => (a.score > b.score ? a : b))

  // Activate if not already active
  if (!best.isActive) {
    await activateVariant(best.id, tradeType, stage)
    return best.id
  }

  return null
}
