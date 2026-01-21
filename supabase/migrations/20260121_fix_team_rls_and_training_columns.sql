-- ============================================
-- FIX TEAM RLS POLICY AND ADD MISSING COLUMNS
-- ============================================

-- Add a direct policy for users to view their own membership
-- This fixes the self-referential RLS policy issue
CREATE POLICY IF NOT EXISTS "Users can view own membership" ON public.organization_members
FOR SELECT USING (user_id = auth.uid());

-- Add missing training data columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS training_data_opt_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_data_contribution_count INTEGER DEFAULT 0;
