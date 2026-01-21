import { SupabaseClient } from "@supabase/supabase-js"
import { createOpenAIClient, chatCompletion, getApiKey } from "./openai"
import { getExtractionPrompt } from "./prompts/extraction"
import { getNormalizationPrompt } from "./prompts/normalization"
import { getRecommendationPrompt } from "./prompts/recommendation"
import { getTradeExamples, formatExtractionExamples, formatNormalizationExamples } from "./prompts/examples"
import { getPatternPromptSection } from "./patterns/injector"
import { selectVariant, updateVariantMetrics, type Variant } from "./variants/manager"
import { extractTextFromPdf } from "./processors/pdf"
import { extractTextFromExcel } from "./processors/excel"
import { extractTextFromWord } from "./processors/word"
import { decrypt } from "@/lib/utils/encryption"
import { isTrialExpired } from "@/lib/utils/format"
import { MetricsCollector, categorizeError } from "@/lib/metrics/collector"
import type { BidDocument, ExtractedItem } from "@/types"

interface ExtractionResult {
  contractor_name: string
  base_bid_total: number | null
  items: {
    description: string
    quantity: number | null
    unit: string | null
    unit_price: number | null
    total_price: number | null
    category: string
    is_exclusion: boolean
    is_inclusion: boolean
    confidence_score: number
    needs_review: boolean
    raw_text: string
    notes: string | null
  }[]
  exclusions_summary: string[]
  inclusions_summary: string[]
  extraction_notes: string
}

interface NormalizationResult {
  normalized_items: {
    normalized_description: string
    category: string
    contractors: {
      contractor_id: string
      contractor_name: string
      status: "included" | "excluded" | "not_mentioned"
      price: number | null
      original_description: string | null
      original_item_id: string | null
    }[]
    is_scope_gap: boolean
    gap_notes: string | null
  }[]
  normalization_notes: string
}

interface RecommendationResult {
  recommended_contractor_id: string
  recommended_contractor_name: string
  confidence: "high" | "medium" | "low"
  reasoning: string
  key_factors: { factor: string; description: string }[]
  warnings: {
    contractor_id: string | null
    type: string
    description: string
  }[]
  price_analysis: {
    lowest_base_bid: { contractor_name: string; amount: number }
    estimated_true_cost: {
      contractor_name: string
      base: number
      estimated_adds: number
      total: number
    }[]
  }
}

export async function analyzeProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  console.log(`Starting analysis for project ${projectId}`)

  // Initialize metrics collector (NOT linked to project - anonymized)
  let metricsCollector: MetricsCollector | null = null

  try {
    // 1. Get project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, bid_documents(*)")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      throw new Error("Project not found")
    }

    // Initialize metrics collector with trade type
    const documents = project.bid_documents as BidDocument[]
    const totalDocumentSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0)
    const primaryDocType = documents[0]?.file_type?.split("/").pop() || "unknown"

    metricsCollector = new MetricsCollector(supabase, project.trade_type, {
      type: primaryDocType,
      sizeBytes: totalDocumentSize,
    })

    // 2. Get user's API key or check trial
    const { data: profile } = await supabase
      .from("profiles")
      .select("openai_api_key_encrypted, trial_started_at")
      .eq("id", project.user_id)
      .single()

    let apiKey: string

    if (profile?.openai_api_key_encrypted) {
      apiKey = decrypt(profile.openai_api_key_encrypted)
    } else if (profile?.trial_started_at && !isTrialExpired(profile.trial_started_at)) {
      apiKey = getApiKey(null)
    } else {
      throw new Error("Trial expired and no API key configured")
    }

    const openai = createOpenAIClient(apiKey)

    // Fetch learned examples for this trade type (non-blocking, fallback to empty)
    const tradeExamples = await getTradeExamples(project.trade_type, 10)
    const extractionExamples = formatExtractionExamples(tradeExamples)
    const normalizationExamples = formatNormalizationExamples(tradeExamples)

    // Fetch learned patterns for this trade type
    const learnedPatterns = await getPatternPromptSection(project.trade_type, 10)

    // Select variants for A/B testing (non-blocking, fallback to null)
    const extractionVariant = await selectVariant(project.trade_type, "extraction")
    const normalizationVariant = await selectVariant(project.trade_type, "normalization")

    // 3. Process each document
    const extractedByDocument: Map<string, ExtractedItem[]> = new Map()
    const extractionStartTime = Date.now()
    let allConfidenceScores: number[] = []
    let totalItemsNeedingReview = 0
    let extractionError: unknown = null

    for (const doc of documents) {
      console.log(`Processing document: ${doc.file_name}`)

      // Update status
      await supabase
        .from("bid_documents")
        .update({ upload_status: "processing" })
        .eq("id", doc.id)

      try {
        // Fetch file content
        const response = await fetch(doc.file_url)
        const buffer = Buffer.from(await response.arrayBuffer())

        // Extract text based on file type
        let text: string
        if (doc.file_type.includes("pdf")) {
          text = await extractTextFromPdf(buffer)
        } else if (
          doc.file_type.includes("spreadsheet") ||
          doc.file_type.includes("excel") ||
          doc.file_type.includes("csv")
        ) {
          text = await extractTextFromExcel(buffer)
        } else if (doc.file_type.includes("word") || doc.file_type.includes("document")) {
          text = await extractTextFromWord(buffer)
        } else {
          throw new Error(`Unsupported file type: ${doc.file_type}`)
        }

        // Save raw text
        await supabase
          .from("bid_documents")
          .update({ raw_text: text })
          .eq("id", doc.id)

        // Run extraction (with learned examples, patterns, and variants if available)
        const extractionPrompt = getExtractionPrompt(
          project.trade_type,
          text,
          extractionExamples,
          learnedPatterns,
          extractionVariant?.content
        )
        const extractionResponse = await chatCompletion(openai, [
          { role: "user", content: extractionPrompt },
        ])

        const extraction: ExtractionResult = JSON.parse(extractionResponse)

        // Save extracted items
        const items: Omit<ExtractedItem, "id" | "created_at" | "updated_at">[] = extraction.items.map(
          (item) => ({
            bid_document_id: doc.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price,
            category: item.category,
            normalized_category: null,
            is_exclusion: item.is_exclusion,
            is_inclusion: item.is_inclusion,
            confidence_score: item.confidence_score,
            needs_review: item.needs_review,
            raw_text: item.raw_text,
            ai_notes: item.notes,
            user_modified: false,
          })
        )

        const { data: insertedItems } = await supabase
          .from("extracted_items")
          .insert(items)
          .select()

        extractedByDocument.set(doc.id, insertedItems || [])

        // Capture metrics data
        allConfidenceScores = allConfidenceScores.concat(
          extraction.items.map((i) => i.confidence_score)
        )
        totalItemsNeedingReview += extraction.items.filter((i) => i.needs_review).length

        // Update document status
        await supabase
          .from("bid_documents")
          .update({ upload_status: "processed" })
          .eq("id", doc.id)
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error)
        extractionError = error
        await supabase
          .from("bid_documents")
          .update({
            upload_status: "error",
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", doc.id)
      }
    }

    // Record extraction metrics
    const extractionDuration = Date.now() - extractionStartTime
    const totalItemsExtracted = Array.from(extractedByDocument.values()).reduce(
      (sum, items) => sum + items.length,
      0
    )

    metricsCollector.recordExtraction({
      success: !extractionError,
      duration_ms: extractionDuration,
      items_count: totalItemsExtracted,
      error_code: extractionError ? categorizeError(extractionError) : undefined,
      confidence_scores: allConfidenceScores,
      items_needing_review: totalItemsNeedingReview,
    })

    // Update variant metrics if a variant was used
    if (extractionVariant) {
      const avgConfidence =
        allConfidenceScores.length > 0
          ? allConfidenceScores.reduce((a, b) => a + b, 0) / allConfidenceScores.length
          : 0
      // We don't know if corrections happened yet, so mark as false
      // Corrections are tracked when user edits items later
      updateVariantMetrics(extractionVariant.id, avgConfidence, false, extractionDuration)
    }

    // 4. Run normalization across all bids
    console.log("Running normalization...")
    const normalizationStartTime = Date.now()

    const contractorsData = documents.map((doc) => ({
      contractorId: doc.id,
      contractorName: doc.contractor_name,
      items: extractedByDocument.get(doc.id) || [],
    }))

    const normalizationPrompt = getNormalizationPrompt(project.trade_type, contractorsData, normalizationExamples)
    const normalizationResponse = await chatCompletion(openai, [
      { role: "user", content: normalizationPrompt },
    ])

    const normalization: NormalizationResult = JSON.parse(normalizationResponse)

    // Record normalization metrics
    const normalizationDuration = Date.now() - normalizationStartTime
    const scopeGapsCount = normalization.normalized_items.filter((ni) => ni.is_scope_gap).length
    const matchedItemsCount = normalization.normalized_items.filter((ni) => !ni.is_scope_gap).length
    const matchRate = totalItemsExtracted > 0 ? matchedItemsCount / totalItemsExtracted : 0

    metricsCollector.recordNormalization({
      success: true,
      duration_ms: normalizationDuration,
      match_rate: matchRate,
      scope_gaps_count: scopeGapsCount,
    })

    // Update normalized_category on items
    for (const normalizedItem of normalization.normalized_items) {
      for (const contractor of normalizedItem.contractors) {
        if (contractor.original_item_id) {
          await supabase
            .from("extracted_items")
            .update({ normalized_category: normalizedItem.normalized_description })
            .eq("id", contractor.original_item_id)
        }
      }
    }

    // 5. Generate recommendation
    console.log("Generating recommendation...")
    const recommendationStartTime = Date.now()

    const contractorSummaries = documents.map((doc) => {
      const items = extractedByDocument.get(doc.id) || []
      const exclusions = items.filter((i) => i.is_exclusion)
      const inclusions = items.filter((i) => !i.is_exclusion)

      return {
        id: doc.id,
        name: doc.contractor_name,
        baseBid: inclusions.reduce((sum, i) => sum + (i.total_price || 0), 0),
        exclusionsCount: exclusions.length,
        exclusionsValue: exclusions.reduce((sum, i) => sum + (i.total_price || 0), 0),
        scopeGapsCount: normalization.normalized_items.filter(
          (ni) =>
            ni.is_scope_gap &&
            ni.contractors.find((c) => c.contractor_id === doc.id)?.status === "not_mentioned"
        ).length,
        averageConfidence:
          items.length > 0
            ? items.reduce((sum, i) => sum + i.confidence_score, 0) / items.length
            : 0,
      }
    })

    const scopeGaps = normalization.normalized_items
      .filter((ni) => ni.is_scope_gap)
      .map((ni) => ({
        description: ni.normalized_description,
        missingFrom: ni.contractors
          .filter((c) => c.status === "not_mentioned")
          .map((c) => c.contractor_name),
        estimatedValue:
          ni.contractors.find((c) => c.price !== null)?.price || null,
      }))

    const recommendationPrompt = getRecommendationPrompt(
      project.trade_type,
      contractorSummaries,
      scopeGaps
    )
    const recommendationResponse = await chatCompletion(openai, [
      { role: "user", content: recommendationPrompt },
    ])

    const recommendation: RecommendationResult = JSON.parse(recommendationResponse)

    // Record recommendation metrics
    const recommendationDuration = Date.now() - recommendationStartTime
    metricsCollector.recordRecommendation({
      success: true,
      duration_ms: recommendationDuration,
      confidence: recommendation.confidence,
    })

    // 6. Save comparison results
    const prices = contractorSummaries.map((c) => c.baseBid).filter((p) => p > 0)
    const comparisonResult = {
      project_id: projectId,
      total_bids: documents.length,
      price_low: prices.length > 0 ? Math.min(...prices) : null,
      price_high: prices.length > 0 ? Math.max(...prices) : null,
      price_average: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
      total_scope_items: normalization.normalized_items.length,
      common_items: normalization.normalized_items.filter((ni) => !ni.is_scope_gap).length,
      gap_items: normalization.normalized_items.filter((ni) => ni.is_scope_gap).length,
      summary_json: {
        contractors: contractorSummaries.map((c) => ({
          id: c.id,
          name: c.name,
          total_bid: c.baseBid,
          base_bid: c.baseBid - c.exclusionsValue,
          exclusions_value: c.exclusionsValue,
          item_count: extractedByDocument.get(c.id)?.length || 0,
          exclusion_count: c.exclusionsCount,
          confidence_avg: c.averageConfidence,
        })),
        scope_gaps: scopeGaps.map((sg) => ({
          description: sg.description,
          present_in: documents
            .filter((d) => !sg.missingFrom.includes(d.contractor_name))
            .map((d) => d.id),
          missing_from: documents
            .filter((d) => sg.missingFrom.includes(d.contractor_name))
            .map((d) => d.id),
          estimated_value: sg.estimatedValue,
        })),
      },
      recommendation_json: {
        recommended_contractor_id: recommendation.recommended_contractor_id,
        recommended_contractor_name: recommendation.recommended_contractor_name,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning,
        key_factors: recommendation.key_factors,
        warnings: recommendation.warnings,
      },
    }

    await supabase.from("comparison_results").upsert(comparisonResult)

    // 7. Update project status
    await supabase
      .from("projects")
      .update({ status: "complete" })
      .eq("id", projectId)

    // Flush metrics (fire-and-forget)
    metricsCollector.flush()

    console.log(`Analysis complete for project ${projectId}`)
  } catch (error) {
    console.error(`Analysis failed for project ${projectId}:`, error)

    // Record error in metrics if collector was initialized
    if (metricsCollector) {
      metricsCollector.recordExtraction({
        success: false,
        duration_ms: 0,
        error_code: categorizeError(error),
      })
      metricsCollector.flush()
    }

    await supabase
      .from("projects")
      .update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Analysis failed",
      })
      .eq("id", projectId)

    throw error
  }
}
