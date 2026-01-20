-- ============================================
-- EMAIL TRACKING FOR HANDSHAKE REMINDERS
-- Migration: 20260120_add_email_tracking.sql
-- ============================================

-- Add email tracking fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS handshake_welcome_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS handshake_reminder_day7_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS handshake_reminder_day21_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS handshake_reminder_day27_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS handshake_expired_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS api_key_success_sent_at TIMESTAMPTZ;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.profiles.handshake_welcome_sent_at IS 'Timestamp when HANDSHAKE welcome email was sent';
COMMENT ON COLUMN public.profiles.handshake_reminder_day7_sent_at IS 'Timestamp when day 7 reminder email was sent';
COMMENT ON COLUMN public.profiles.handshake_reminder_day21_sent_at IS 'Timestamp when day 21 reminder email was sent';
COMMENT ON COLUMN public.profiles.handshake_reminder_day27_sent_at IS 'Timestamp when day 27 reminder email was sent';
COMMENT ON COLUMN public.profiles.handshake_expired_sent_at IS 'Timestamp when free period expired email was sent';
COMMENT ON COLUMN public.profiles.api_key_success_sent_at IS 'Timestamp when API key success email was sent';
