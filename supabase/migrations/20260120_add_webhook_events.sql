-- Migration: Add webhook events table for idempotency
-- This prevents duplicate processing of Stripe webhook events

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    payload JSONB
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);

-- Auto-cleanup old events (keep 30 days)
-- This can be run via a cron job or manually
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
    DELETE FROM public.webhook_events
    WHERE processed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- No RLS needed - only server-side access via service role
