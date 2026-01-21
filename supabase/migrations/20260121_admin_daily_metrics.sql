-- Admin Daily Metrics Table
-- Stores aggregated daily metrics for admin dashboard analytics

CREATE TABLE IF NOT EXISTS public.admin_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,

  -- User metrics
  new_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,  -- Users with activity in last 24h

  -- Subscription metrics
  new_subscriptions INTEGER DEFAULT 0,
  canceled_subscriptions INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,

  -- Revenue metrics (in cents for precision)
  mrr_snapshot INTEGER DEFAULT 0,  -- Monthly recurring revenue in cents

  -- Usage metrics
  projects_created INTEGER DEFAULT 0,
  documents_processed INTEGER DEFAULT 0,
  comparisons_completed INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_purchased INTEGER DEFAULT 0,

  -- AI metrics
  ai_analyses_count INTEGER DEFAULT 0,
  ai_success_count INTEGER DEFAULT 0,
  avg_confidence DECIMAL(5, 4) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient date queries
CREATE INDEX IF NOT EXISTS idx_admin_daily_metrics_date ON admin_daily_metrics(date DESC);

-- This table is admin-only, no RLS needed as we use service role key
-- But we still enable RLS and deny all user access for safety
ALTER TABLE public.admin_daily_metrics ENABLE ROW LEVEL SECURITY;

-- No policies = no user access (only service role can access)
-- This ensures the table is only accessible via admin API routes
