-- Production foundation for signup credits, billing metadata, folders, and credit ledger.
-- This migration is intentionally idempotent because some live databases already have
-- parts of this shape from manual hotfixes or later migrations.

DO $$ BEGIN
  CREATE TYPE public.plan_type AS ENUM ('free', 'basic', 'pro', 'team', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'plan_type'
      AND e.enumlabel = 'basic'
  ) THEN
    ALTER TYPE public.plan_type ADD VALUE 'basic';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('inactive', 'active', 'past_due', 'canceled', 'trialing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.credit_transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus', 'signup');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS gc_name TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS plan public.plan_type DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status DEFAULT 'inactive' NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle public.billing_cycle,
  ADD COLUMN IF NOT EXISTS comparisons_used INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 5 NOT NULL,
  ADD COLUMN IF NOT EXISTS credits_purchased_total INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_credit_purchase_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credits INTEGER,
  ADD COLUMN IF NOT EXISTS attribution_source TEXT,
  ADD COLUMN IF NOT EXISTS attribution_campaign TEXT,
  ADD COLUMN IF NOT EXISTS attribution_email_id TEXT,
  ADD COLUMN IF NOT EXISTS attribution_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_signup_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS procore_access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS procore_refresh_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS procore_company_id TEXT,
  ADD COLUMN IF NOT EXISTS procore_company_name TEXT,
  ADD COLUMN IF NOT EXISTS procore_user_id TEXT,
  ADD COLUMN IF NOT EXISTS procore_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS procore_connected_at TIMESTAMPTZ;

UPDATE public.profiles
SET credits = credit_balance
WHERE credits IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at);

CREATE TABLE IF NOT EXISTS public.project_folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  client_name TEXT,
  project_size TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own folders" ON public.project_folders;
CREATE POLICY "Users can view own folders" ON public.project_folders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own folders" ON public.project_folders;
CREATE POLICY "Users can create own folders" ON public.project_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own folders" ON public.project_folders;
CREATE POLICY "Users can update own folders" ON public.project_folders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own folders" ON public.project_folders;
CREATE POLICY "Users can delete own folders" ON public.project_folders
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_folders_user_id ON public.project_folders(user_id);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.project_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS procore_project_id TEXT,
  ADD COLUMN IF NOT EXISTS procore_project_name TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT DEFAULT 'manual' NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_folder_id ON public.projects(folder_id);

ALTER TABLE public.bid_documents
  ADD COLUMN IF NOT EXISTS procore_bid_id TEXT,
  ADD COLUMN IF NOT EXISTS procore_vendor_id TEXT,
  ADD COLUMN IF NOT EXISTS source_system TEXT DEFAULT 'upload' NOT NULL;

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type public.credit_transaction_type DEFAULT 'bonus',
  p_description TEXT DEFAULT NULL,
  p_stripe_session_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET credit_balance = COALESCE(credit_balance, 0) + p_amount,
      credits = COALESCE(credit_balance, 0) + p_amount,
      credits_purchased_total = CASE
        WHEN p_type = 'purchase' THEN COALESCE(credits_purchased_total, 0) + p_amount
        ELSE credits_purchased_total
      END,
      last_credit_purchase_at = CASE
        WHEN p_type = 'purchase' THEN NOW()
        ELSE last_credit_purchase_at
      END
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  INSERT INTO public.credit_transactions(user_id, type, amount, balance_after, description, stripe_checkout_session_id)
  VALUES (p_user_id, p_type, p_amount, v_balance, p_description, p_stripe_session_id);

  RETURN jsonb_build_object('success', true, 'balance', v_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1,
  p_project_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT credit_balance
  INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  IF COALESCE(v_balance, 0) < p_amount THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_credits', 'balance', COALESCE(v_balance, 0));
  END IF;

  UPDATE public.profiles
  SET credit_balance = credit_balance - p_amount,
      credits = credit_balance - p_amount
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_balance;

  INSERT INTO public.credit_transactions(user_id, type, amount, balance_after, description, project_id)
  VALUES (p_user_id, 'usage', -p_amount, v_balance, p_description, p_project_id);

  RETURN jsonb_build_object('success', true, 'balance', v_balance);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credit_balance, credits)
  VALUES (NEW.id, NEW.email, 5, 5)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description)
  VALUES (NEW.id, 'signup', 5, 5, 'Signup bonus credits');

  RETURN NEW;
END;
$$;
