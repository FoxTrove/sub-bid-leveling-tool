-- ============================================
-- AI METRICS & TRAINING DATA TABLES
-- Migration: 20260115_add_ai_metrics.sql
-- ============================================

-- AI Pipeline Metrics (anonymized, service-role only)
-- Tracks performance metrics per analysis without linking to users or projects
CREATE TABLE IF NOT EXISTS public.ai_pipeline_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_run_id UUID NOT NULL,  -- Unique per analysis, NOT linked to project/user

    -- Context (no identifying info)
    trade_type TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_size_bytes INTEGER,

    -- Extraction stage metrics
    extraction_success BOOLEAN NOT NULL,
    extraction_duration_ms INTEGER,
    extraction_items_count INTEGER,
    extraction_error_code TEXT,

    -- Normalization stage metrics
    normalization_success BOOLEAN,
    normalization_duration_ms INTEGER,
    normalization_match_rate DECIMAL(5,4),
    normalization_scope_gaps_count INTEGER,

    -- Recommendation stage metrics
    recommendation_success BOOLEAN,
    recommendation_duration_ms INTEGER,
    recommendation_confidence TEXT,

    -- Confidence aggregates (no individual item data)
    avg_confidence_score DECIMAL(5,4),
    min_confidence_score DECIMAL(5,4),
    max_confidence_score DECIMAL(5,4),
    low_confidence_items_count INTEGER,
    items_needing_review_count INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_metrics_trade ON public.ai_pipeline_metrics(trade_type);
CREATE INDEX IF NOT EXISTS idx_metrics_doc_type ON public.ai_pipeline_metrics(document_type);
CREATE INDEX IF NOT EXISTS idx_metrics_created ON public.ai_pipeline_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_success ON public.ai_pipeline_metrics(extraction_success, normalization_success);

-- Enable RLS but no user policies (service role only)
ALTER TABLE public.ai_pipeline_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRAINING CONTRIBUTIONS (anonymized, no user link)
-- ============================================

CREATE TABLE IF NOT EXISTS public.training_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Context (no identifying info)
    trade_type TEXT NOT NULL,
    document_type TEXT NOT NULL,
    correction_type TEXT NOT NULL,  -- 'description', 'category', 'price', 'exclusion_flag', 'quantity', 'unit'

    -- The correction pair (anonymized)
    original_value JSONB NOT NULL,
    corrected_value JSONB NOT NULL,

    -- Additional context for training
    raw_text_snippet TEXT,  -- Anonymized snippet of source text
    ai_notes TEXT,
    confidence_score_original DECIMAL(3,2),
    was_marked_needs_review BOOLEAN,

    -- Moderation status
    moderation_status TEXT DEFAULT 'pending' NOT NULL,  -- 'pending', 'approved', 'rejected'
    moderated_at TIMESTAMPTZ,
    moderation_notes TEXT,

    contributed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for training data queries
CREATE INDEX IF NOT EXISTS idx_training_trade ON public.training_contributions(trade_type);
CREATE INDEX IF NOT EXISTS idx_training_correction ON public.training_contributions(correction_type);
CREATE INDEX IF NOT EXISTS idx_training_moderation ON public.training_contributions(moderation_status);
CREATE INDEX IF NOT EXISTS idx_training_contributed ON public.training_contributions(contributed_at DESC);

-- Enable RLS but no user policies (service role only)
ALTER TABLE public.training_contributions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILE EXTENSIONS FOR OPT-IN
-- ============================================

-- Add training data opt-in columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS training_data_opt_in BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS training_data_opted_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS training_data_contribution_count INTEGER DEFAULT 0 NOT NULL;

-- ============================================
-- HELPER FUNCTION: Increment contribution count
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_contribution_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET training_data_contribution_count = training_data_contribution_count + 1
    WHERE id = user_id;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.ai_pipeline_metrics IS 'Anonymized AI pipeline performance metrics. No user or project linking.';
COMMENT ON TABLE public.training_contributions IS 'Anonymized user corrections for AI training. No user linking.';
COMMENT ON COLUMN public.ai_pipeline_metrics.pipeline_run_id IS 'Random UUID per analysis run. NOT linked to project_id.';
COMMENT ON COLUMN public.training_contributions.correction_type IS 'Type of correction: description, category, price, exclusion_flag, quantity, unit';

-- ============================================
-- ANALYTICS REPORTS (for cron job storage)
-- ============================================

CREATE TABLE IF NOT EXISTS public.analytics_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL,  -- 'weekly', 'monthly', 'custom'
    report_data JSONB NOT NULL,
    alerts JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON public.analytics_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.analytics_reports(created_at DESC);

-- Enable RLS but no user policies (service role only)
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.analytics_reports IS 'Stored analytics reports from weekly/monthly cron jobs.';
