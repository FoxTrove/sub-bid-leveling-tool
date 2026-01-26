-- Migration: Add leveling fields and bid quality tracking
-- Date: 2026-01-27
-- Description: Adds columns for bid leveling (baselines, leveled totals) and quality scoring (red flags, completeness)

-- ============================================
-- COMPARISON RESULTS - Leveling Support
-- ============================================

-- Add leveling configuration storage
-- Stores baseline quantities and calculated leveled totals
ALTER TABLE comparison_results
ADD COLUMN IF NOT EXISTS leveling_json JSONB;

COMMENT ON COLUMN comparison_results.leveling_json IS 'Stores bid leveling configuration: baselines per item and leveled totals per contractor';

-- ============================================
-- BID DOCUMENTS - Quality Scoring
-- ============================================

-- Add quality score (0-100 completeness score)
ALTER TABLE bid_documents
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);

COMMENT ON COLUMN bid_documents.quality_score IS 'Bid completeness score from 0-100 based on line item detail, exclusions clarity, scope coverage, and pricing completeness';

-- Add red flags storage (array of detected issues)
ALTER TABLE bid_documents
ADD COLUMN IF NOT EXISTS red_flags JSONB;

COMMENT ON COLUMN bid_documents.red_flags IS 'Array of detected bid quality issues: price outliers, vague scope, missing items, excessive allowances, etc.';

-- ============================================
-- EXTRACTED ITEMS - Leveling Support
-- ============================================

-- Add baseline tracking for leveling
ALTER TABLE extracted_items
ADD COLUMN IF NOT EXISTS is_baseline BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN extracted_items.is_baseline IS 'Whether this item''s quantity is used as the baseline for bid leveling';

-- Add leveled price (calculated from baseline qty × unit price)
ALTER TABLE extracted_items
ADD COLUMN IF NOT EXISTS leveled_price DECIMAL(12,2);

COMMENT ON COLUMN extracted_items.leveled_price IS 'Calculated leveled price: baseline_quantity × unit_price';

-- ============================================
-- INDEXES
-- ============================================

-- Index for baseline lookups during leveling
CREATE INDEX IF NOT EXISTS idx_extracted_items_baseline
ON extracted_items (bid_document_id, is_baseline)
WHERE is_baseline = TRUE;

-- Index for quality score filtering
CREATE INDEX IF NOT EXISTS idx_bid_documents_quality_score
ON bid_documents (quality_score)
WHERE quality_score IS NOT NULL;
