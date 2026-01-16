import { SupabaseClient } from '@supabase/supabase-js'

export interface ExtractionMetrics {
  success: boolean
  duration_ms: number
  token_count?: number
  items_count?: number
  error_code?: string
  confidence_scores?: number[]
  items_needing_review?: number
}

export interface NormalizationMetrics {
  success: boolean
  duration_ms: number
  token_count?: number
  match_rate?: number
  scope_gaps_count?: number
}

export interface RecommendationMetrics {
  success: boolean
  duration_ms: number
  confidence?: 'high' | 'medium' | 'low'
}

export interface DocumentMeta {
  type: string
  sizeBytes?: number
}

/**
 * MetricsCollector collects anonymized pipeline performance metrics.
 *
 * PRIVACY: This collector does NOT link metrics to users or projects.
 * The pipeline_run_id is a random UUID that cannot be traced back.
 */
export class MetricsCollector {
  private supabase: SupabaseClient
  private pipelineRunId: string
  private tradeType: string
  private documentMeta: DocumentMeta

  private extractionMetrics: ExtractionMetrics | null = null
  private normalizationMetrics: NormalizationMetrics | null = null
  private recommendationMetrics: RecommendationMetrics | null = null

  constructor(
    supabase: SupabaseClient,
    tradeType: string,
    documentMeta: DocumentMeta
  ) {
    this.supabase = supabase
    this.pipelineRunId = crypto.randomUUID()  // NOT linked to project ID
    this.tradeType = tradeType
    this.documentMeta = documentMeta
  }

  /**
   * Record metrics from the extraction stage
   */
  recordExtraction(metrics: ExtractionMetrics): void {
    this.extractionMetrics = metrics
  }

  /**
   * Record metrics from the normalization stage
   */
  recordNormalization(metrics: NormalizationMetrics): void {
    this.normalizationMetrics = metrics
  }

  /**
   * Record metrics from the recommendation stage
   */
  recordRecommendation(metrics: RecommendationMetrics): void {
    this.recommendationMetrics = metrics
  }

  /**
   * Flush all collected metrics to the database.
   * This is fire-and-forget - errors are logged but don't fail the pipeline.
   */
  async flush(): Promise<void> {
    if (!this.extractionMetrics) {
      return
    }

    const confidenceScores = this.extractionMetrics.confidence_scores || []

    const metricsRow = {
      pipeline_run_id: this.pipelineRunId,
      trade_type: this.tradeType,
      document_type: this.documentMeta.type,
      document_size_bytes: this.documentMeta.sizeBytes,

      // Extraction metrics
      extraction_success: this.extractionMetrics.success,
      extraction_duration_ms: this.extractionMetrics.duration_ms,
      extraction_items_count: this.extractionMetrics.items_count,
      extraction_error_code: this.extractionMetrics.error_code,

      // Normalization metrics
      normalization_success: this.normalizationMetrics?.success,
      normalization_duration_ms: this.normalizationMetrics?.duration_ms,
      normalization_match_rate: this.normalizationMetrics?.match_rate,
      normalization_scope_gaps_count: this.normalizationMetrics?.scope_gaps_count,

      // Recommendation metrics
      recommendation_success: this.recommendationMetrics?.success,
      recommendation_duration_ms: this.recommendationMetrics?.duration_ms,
      recommendation_confidence: this.recommendationMetrics?.confidence,

      // Confidence aggregates
      avg_confidence_score: confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : null,
      min_confidence_score: confidenceScores.length > 0
        ? Math.min(...confidenceScores)
        : null,
      max_confidence_score: confidenceScores.length > 0
        ? Math.max(...confidenceScores)
        : null,
      low_confidence_items_count: confidenceScores.filter(s => s < 0.6).length,
      items_needing_review_count: this.extractionMetrics.items_needing_review,
    }

    // Fire and forget - don't block the main pipeline
    this.supabase
      .from('ai_pipeline_metrics')
      .insert(metricsRow)
      .then(({ error }) => {
        if (error) {
          console.error('[MetricsCollector] Failed to record metrics:', error.message)
        }
      })
  }
}

/**
 * Categorize errors into standard codes for metrics tracking
 */
export function categorizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('rate limit') || message.includes('429')) {
      return 'RATE_LIMIT'
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT'
    }
    if (message.includes('invalid') || message.includes('parse')) {
      return 'PARSE_ERROR'
    }
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('401')) {
      return 'AUTH_ERROR'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR'
    }
    if (message.includes('quota') || message.includes('insufficient')) {
      return 'QUOTA_ERROR'
    }
  }

  return 'UNKNOWN_ERROR'
}
