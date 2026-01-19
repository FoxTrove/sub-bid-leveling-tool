-- ============================================
-- PROMO CODE SYSTEM (HANDSHAKE)
-- Migration: 20260116_add_promo_code.sql
-- ============================================

-- Add promo code fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS promo_applied_at TIMESTAMPTZ;

-- Index for querying users by promo code
CREATE INDEX IF NOT EXISTS idx_profiles_promo_code ON public.profiles(promo_code);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.profiles.promo_code IS 'Promo code used during signup (e.g., HANDSHAKE)';
COMMENT ON COLUMN public.profiles.promo_applied_at IS 'Timestamp when the promo code was applied';
