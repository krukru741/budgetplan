-- ============================================================
-- BudgetPlan — Migration 003: Onboarding Flag
-- Decision Log: Phase 1 Onboarding tracking
-- ============================================================

-- Add onboarding completion timestamp to track if a user has finished the initial setup
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
 