-- ============================================================
-- BudgetPlan — Migration 002: RLS Policies + Triggers
-- Decision Log: #11 (UUID FK, trigger), #12 (category clone)
-- ============================================================

-- ----------------------------------------------------------------
-- Helper: updated_at auto-update trigger function
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all tables that have it
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'user_preferences', 'accounts', 'categories',
    'transactions', 'recurring_transactions', 'budgets',
    'bills', 'goals', 'debts'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- Default categories seed function (Decision Log #12 — Option B)
-- Called by the on_auth_user_created trigger for every new signup.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, type, group_name, icon, color, is_default) VALUES
    -- EXPENSE — Needs
    (p_user_id, 'Housing',        'expense', 'needs',     'home',          '#2563EB', TRUE),
    (p_user_id, 'Food',           'expense', 'needs',     'utensils',      '#16A34A', TRUE),
    (p_user_id, 'Utilities',      'expense', 'needs',     'zap',           '#F59E0B', TRUE),
    (p_user_id, 'Transportation', 'expense', 'needs',     'car',           '#8B5CF6', TRUE),
    (p_user_id, 'Healthcare',     'expense', 'needs',     'heart-pulse',   '#EF4444', TRUE),
    -- EXPENSE — Wants
    (p_user_id, 'Shopping',       'expense', 'wants',     'shopping-bag',  '#EC4899', TRUE),
    (p_user_id, 'Entertainment',  'expense', 'wants',     'tv',            '#06B6D4', TRUE),
    -- EXPENSE — Financial
    (p_user_id, 'Savings',        'expense', 'financial', 'piggy-bank',    '#10B981', TRUE),
    (p_user_id, 'Investments',    'expense', 'financial', 'trending-up',   '#3B82F6', TRUE),
    (p_user_id, 'Debt',           'expense', 'financial', 'credit-card',   '#F97316', TRUE),
    -- INCOME
    (p_user_id, 'Salary',         'income',  NULL,        'briefcase',     '#16A34A', TRUE),
    (p_user_id, 'Freelance',      'income',  NULL,        'laptop',        '#6366F1', TRUE),
    (p_user_id, 'Business',       'income',  NULL,        'building',      '#0EA5E9', TRUE),
    (p_user_id, 'Other Income',   'income',  NULL,        'plus-circle',   '#64748B', TRUE);
END;
$$;

-- ----------------------------------------------------------------
-- Main trigger: on new auth.users row
-- 1. Creates public.users profile row
-- 2. Creates user_preferences row
-- 3. Clones default categories for the new user
-- All in one transaction — all-or-nothing (Decision Log #11, #12)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Create profile row (extends auth.users)
  INSERT INTO public.users (id, name, currency, timezone, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'PHP'),
    'Asia/Manila',
    'en-PH'
  );

  -- 2. Create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  -- 3. Clone default categories for this user (Decision Log #12)
  PERFORM public.seed_default_categories(NEW.id);

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (fires on every new signup)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- Row-Level Security (RLS)
-- Policy pattern: auth.uid() = user_id — NO exceptions (Decision Log #11)
-- ----------------------------------------------------------------

-- Enable RLS on all public tables
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- RLS Policies — users
-- ----------------------------------------------------------------
CREATE POLICY "users: own row only"
  ON public.users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------
-- RLS Policies — user_preferences
-- ----------------------------------------------------------------
CREATE POLICY "user_preferences: own only"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — accounts
-- ----------------------------------------------------------------
CREATE POLICY "accounts: own only"
  ON public.accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — categories
-- ----------------------------------------------------------------
CREATE POLICY "categories: own only"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — transactions
-- ----------------------------------------------------------------
CREATE POLICY "transactions: own only"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — receipts (access via transaction ownership)
-- ----------------------------------------------------------------
CREATE POLICY "receipts: own transactions only"
  ON public.receipts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = receipts.transaction_id
        AND t.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- RLS Policies — recurring_transactions
-- ----------------------------------------------------------------
CREATE POLICY "recurring_transactions: own only"
  ON public.recurring_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — budgets
-- ----------------------------------------------------------------
CREATE POLICY "budgets: own only"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — bills
-- ----------------------------------------------------------------
CREATE POLICY "bills: own only"
  ON public.bills FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — bill_payments (access via bill ownership)
-- ----------------------------------------------------------------
CREATE POLICY "bill_payments: own bills only"
  ON public.bill_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_payments.bill_id
        AND b.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- RLS Policies — goals
-- ----------------------------------------------------------------
CREATE POLICY "goals: own only"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — goal_contributions (access via goal ownership)
-- ----------------------------------------------------------------
CREATE POLICY "goal_contributions: own goals only"
  ON public.goal_contributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_contributions.goal_id
        AND g.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- RLS Policies — debts
-- ----------------------------------------------------------------
CREATE POLICY "debts: own only"
  ON public.debts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — debt_payments (access via debt ownership)
-- ----------------------------------------------------------------
CREATE POLICY "debt_payments: own debts only"
  ON public.debt_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.debts d
      WHERE d.id = debt_payments.debt_id
        AND d.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------
-- RLS Policies — transfers
-- ----------------------------------------------------------------
CREATE POLICY "transfers: own only"
  ON public.transfers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — notifications
-- ----------------------------------------------------------------
CREATE POLICY "notifications: own only"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — monthly_reports
-- ----------------------------------------------------------------
CREATE POLICY "monthly_reports: own only"
  ON public.monthly_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RLS Policies — audit_logs (read + insert only; no update/delete)
-- ----------------------------------------------------------------
CREATE POLICY "audit_logs: own read"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "audit_logs: own insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
