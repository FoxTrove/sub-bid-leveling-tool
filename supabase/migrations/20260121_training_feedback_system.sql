-- ============================================
-- TRAINING FEEDBACK SYSTEM TABLES
-- Migration: 20260121_training_feedback_system.sql
-- ============================================

-- ============================================
-- PHASE 2: PROMPT REFINEMENTS TABLE
-- Auto-detected patterns from corrections
-- ============================================

CREATE TABLE IF NOT EXISTS public.prompt_refinements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_type TEXT NOT NULL,
    refinement_type TEXT NOT NULL, -- 'terminology', 'category_rule', 'extraction_rule'
    pattern_key TEXT NOT NULL,     -- e.g., "rough" (the original pattern)
    pattern_value JSONB NOT NULL,  -- { "from": "rough", "to": "Rough-in", "context": "..." }
    occurrence_count INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    auto_promoted_at TIMESTAMPTZ,
    manually_approved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique constraint on trade + type + key
CREATE UNIQUE INDEX IF NOT EXISTS idx_refinements_unique
    ON public.prompt_refinements(trade_type, refinement_type, pattern_key);

-- Index for active patterns lookup
CREATE INDEX IF NOT EXISTS idx_refinements_active
    ON public.prompt_refinements(trade_type, is_active)
    WHERE is_active = TRUE;

-- Index for occurrence counting (pattern analysis)
CREATE INDEX IF NOT EXISTS idx_refinements_occurrence
    ON public.prompt_refinements(trade_type, occurrence_count DESC);

-- Enable RLS (service role only)
ALTER TABLE public.prompt_refinements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 3: PROMPT VARIANTS TABLE
-- A/B testing for trade-specific prompts
-- ============================================

CREATE TABLE IF NOT EXISTS public.prompt_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_type TEXT NOT NULL,
    pipeline_stage TEXT NOT NULL, -- 'extraction', 'normalization', 'recommendation'
    variant_name TEXT NOT NULL,
    variant_content TEXT NOT NULL, -- Additional prompt text to inject
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    is_control BOOLEAN DEFAULT FALSE NOT NULL, -- Control group (baseline)

    -- Performance metrics
    total_runs INTEGER DEFAULT 0 NOT NULL,
    avg_confidence DECIMAL(5,4),
    correction_rate DECIMAL(5,4), -- corrections per run
    avg_extraction_time_ms INTEGER,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_run_at TIMESTAMPTZ
);

-- Unique variant names per trade + stage
CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_unique
    ON public.prompt_variants(trade_type, pipeline_stage, variant_name);

-- Index for variant selection
CREATE INDEX IF NOT EXISTS idx_variants_active
    ON public.prompt_variants(trade_type, pipeline_stage, is_active)
    WHERE is_active = TRUE OR is_control = TRUE;

-- Enable RLS (service role only)
ALTER TABLE public.prompt_variants ENABLE ROW LEVEL SECURITY;

-- Add variant_id to ai_pipeline_metrics for tracking
ALTER TABLE public.ai_pipeline_metrics
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.prompt_variants(id);

CREATE INDEX IF NOT EXISTS idx_metrics_variant
    ON public.ai_pipeline_metrics(variant_id)
    WHERE variant_id IS NOT NULL;

-- ============================================
-- PHASE 4: TRADE CONFIDENCE THRESHOLDS TABLE
-- Dynamic confidence calibration per trade
-- ============================================

CREATE TABLE IF NOT EXISTS public.trade_confidence_thresholds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_type TEXT NOT NULL UNIQUE,

    -- Calibrated thresholds
    low_threshold DECIMAL(3,2) DEFAULT 0.60 NOT NULL,
    medium_threshold DECIMAL(3,2) DEFAULT 0.80 NOT NULL,

    -- Correction stats for calibration
    total_corrections INTEGER DEFAULT 0 NOT NULL,
    corrections_at_high INTEGER DEFAULT 0 NOT NULL,   -- corrections where confidence >= medium_threshold
    corrections_at_medium INTEGER DEFAULT 0 NOT NULL, -- corrections where confidence >= low but < medium
    corrections_at_low INTEGER DEFAULT 0 NOT NULL,    -- corrections where confidence < low_threshold

    -- Calibration metadata
    last_calibrated_at TIMESTAMPTZ,
    calibration_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for threshold lookup
CREATE INDEX IF NOT EXISTS idx_thresholds_trade
    ON public.trade_confidence_thresholds(trade_type);

-- Enable RLS (service role only)
ALTER TABLE public.trade_confidence_thresholds ENABLE ROW LEVEL SECURITY;

-- Seed with all trade types
INSERT INTO public.trade_confidence_thresholds (trade_type)
VALUES
    ('Electrical'),
    ('Plumbing'),
    ('HVAC'),
    ('Mechanical'),
    ('Fire Protection'),
    ('Roofing'),
    ('Concrete'),
    ('Masonry'),
    ('Steel/Structural'),
    ('Drywall/Framing'),
    ('Painting'),
    ('Flooring'),
    ('Millwork/Casework'),
    ('Glass/Glazing'),
    ('Landscaping'),
    ('Sitework/Earthwork'),
    ('Demolition'),
    ('Insulation'),
    ('Waterproofing'),
    ('Other')
ON CONFLICT (trade_type) DO NOTHING;

-- ============================================
-- PHASE 5: CORRECTION EMBEDDINGS TABLE
-- Vector storage for RAG retrieval
-- ============================================

-- Enable pgvector extension (must be enabled in Supabase dashboard first)
-- CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.correction_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contribution_id UUID REFERENCES public.training_contributions(id) ON DELETE CASCADE,
    trade_type TEXT NOT NULL,
    correction_type TEXT NOT NULL,

    -- The embedded content
    embedded_text TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small dimension

    -- Metadata for filtering
    quality_score DECIMAL(3,2), -- From quality scorer (0-1)
    is_high_quality BOOLEAN DEFAULT FALSE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for vector similarity search (requires pgvector)
-- This will be created when pgvector is enabled
-- CREATE INDEX idx_embeddings_vector ON public.correction_embeddings
--     USING hnsw (embedding vector_cosine_ops);

-- Index for filtering by trade type
CREATE INDEX IF NOT EXISTS idx_embeddings_trade
    ON public.correction_embeddings(trade_type, correction_type);

-- Index for high quality filtering
CREATE INDEX IF NOT EXISTS idx_embeddings_quality
    ON public.correction_embeddings(trade_type, is_high_quality)
    WHERE is_high_quality = TRUE;

-- Index for unprocessed contributions
CREATE INDEX IF NOT EXISTS idx_embeddings_contribution
    ON public.correction_embeddings(contribution_id);

-- Enable RLS (service role only)
ALTER TABLE public.correction_embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PHASE 6: FINE-TUNING EXPORTS TABLE
-- Track export batches for fine-tuning
-- ============================================

CREATE TABLE IF NOT EXISTS public.fine_tuning_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Export metadata
    export_name TEXT NOT NULL,
    export_format TEXT DEFAULT 'jsonl' NOT NULL, -- 'jsonl', 'csv'

    -- Stats
    total_examples INTEGER NOT NULL,
    examples_by_trade JSONB NOT NULL, -- { "Electrical": 150, "Plumbing": 100, ... }
    examples_by_type JSONB NOT NULL,  -- { "description": 200, "price": 50, ... }

    -- Quality filtering applied
    min_quality_score DECIMAL(3,2),

    -- Storage location (signed URL expires, so just store reference)
    storage_path TEXT, -- e.g., "exports/2026-01-21_finetune_v1.jsonl"

    -- Status
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'generating', 'complete', 'error'
    error_message TEXT,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Index for listing exports
CREATE INDEX IF NOT EXISTS idx_exports_status
    ON public.fine_tuning_exports(status, created_at DESC);

-- Enable RLS (service role only)
ALTER TABLE public.fine_tuning_exports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get active patterns for a trade
-- ============================================

CREATE OR REPLACE FUNCTION public.get_active_patterns(
    p_trade_type TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    pattern_key TEXT,
    pattern_value JSONB,
    refinement_type TEXT,
    occurrence_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.pattern_key,
        pr.pattern_value,
        pr.refinement_type,
        pr.occurrence_count
    FROM public.prompt_refinements pr
    WHERE pr.trade_type = p_trade_type
      AND pr.is_active = TRUE
    ORDER BY pr.occurrence_count DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Select variant with A/B logic
-- Returns active variant 80% of time, control 20%
-- ============================================

CREATE OR REPLACE FUNCTION public.select_variant(
    p_trade_type TEXT,
    p_stage TEXT
)
RETURNS TABLE (
    variant_id UUID,
    variant_name TEXT,
    variant_content TEXT,
    is_control BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_random FLOAT;
BEGIN
    v_random := random();

    -- 80% active variant, 20% control
    IF v_random < 0.8 THEN
        RETURN QUERY
        SELECT
            pv.id,
            pv.variant_name,
            pv.variant_content,
            pv.is_control
        FROM public.prompt_variants pv
        WHERE pv.trade_type = p_trade_type
          AND pv.pipeline_stage = p_stage
          AND pv.is_active = TRUE
          AND pv.is_control = FALSE
        ORDER BY random()
        LIMIT 1;
    ELSE
        RETURN QUERY
        SELECT
            pv.id,
            pv.variant_name,
            pv.variant_content,
            pv.is_control
        FROM public.prompt_variants pv
        WHERE pv.trade_type = p_trade_type
          AND pv.pipeline_stage = p_stage
          AND pv.is_control = TRUE
        LIMIT 1;
    END IF;

    -- If no result, return NULL
    IF NOT FOUND THEN
        RETURN;
    END IF;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Update variant metrics
-- ============================================

CREATE OR REPLACE FUNCTION public.update_variant_metrics(
    p_variant_id UUID,
    p_confidence DECIMAL,
    p_had_correction BOOLEAN,
    p_extraction_time_ms INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.prompt_variants
    SET
        total_runs = total_runs + 1,
        avg_confidence = CASE
            WHEN total_runs = 0 THEN p_confidence
            ELSE (avg_confidence * total_runs + p_confidence) / (total_runs + 1)
        END,
        correction_rate = CASE
            WHEN total_runs = 0 THEN CASE WHEN p_had_correction THEN 1.0 ELSE 0.0 END
            ELSE (correction_rate * total_runs + CASE WHEN p_had_correction THEN 1.0 ELSE 0.0 END) / (total_runs + 1)
        END,
        avg_extraction_time_ms = CASE
            WHEN p_extraction_time_ms IS NULL THEN avg_extraction_time_ms
            WHEN avg_extraction_time_ms IS NULL THEN p_extraction_time_ms
            ELSE (avg_extraction_time_ms * total_runs + p_extraction_time_ms) / (total_runs + 1)
        END,
        last_run_at = NOW(),
        updated_at = NOW()
    WHERE id = p_variant_id;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Get calibrated thresholds
-- ============================================

CREATE OR REPLACE FUNCTION public.get_confidence_thresholds(
    p_trade_type TEXT
)
RETURNS TABLE (
    low_threshold DECIMAL,
    medium_threshold DECIMAL,
    is_calibrated BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tct.low_threshold,
        tct.medium_threshold,
        tct.last_calibrated_at IS NOT NULL
    FROM public.trade_confidence_thresholds tct
    WHERE tct.trade_type = p_trade_type;

    -- If no row found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0.60::DECIMAL, 0.80::DECIMAL, FALSE;
    END IF;
END;
$$;

-- ============================================
-- TRIGGER: Update prompt_refinements updated_at
-- ============================================

CREATE TRIGGER update_prompt_refinements_updated_at
    BEFORE UPDATE ON public.prompt_refinements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_variants_updated_at
    BEFORE UPDATE ON public.prompt_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_confidence_thresholds_updated_at
    BEFORE UPDATE ON public.trade_confidence_thresholds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.prompt_refinements IS 'Auto-detected patterns from user corrections for prompt improvement.';
COMMENT ON TABLE public.prompt_variants IS 'A/B testing variants for trade-specific prompt optimization.';
COMMENT ON TABLE public.trade_confidence_thresholds IS 'Dynamic confidence thresholds calibrated per trade type.';
COMMENT ON TABLE public.correction_embeddings IS 'Vector embeddings of corrections for RAG-based example retrieval.';
COMMENT ON TABLE public.fine_tuning_exports IS 'Export batches of training data for model fine-tuning.';

COMMENT ON FUNCTION public.get_active_patterns IS 'Get active prompt refinement patterns for a trade type.';
COMMENT ON FUNCTION public.select_variant IS 'A/B select a prompt variant (80% active, 20% control).';
COMMENT ON FUNCTION public.update_variant_metrics IS 'Update variant performance metrics after a run.';
COMMENT ON FUNCTION public.get_confidence_thresholds IS 'Get calibrated confidence thresholds for a trade type.';
