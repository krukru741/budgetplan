-- ============================================================
-- BudgetPlan — Migration 001: Schema
-- Decision Log: #6 (rollover), #7 (goal completion),
--               #8 (receipts), #11 (Supabase Auth delegation),
--               #12 (categories per-user, NOT NULL)
-- All monetary fields: DECIMAL(14,2) — never FLOAT/DOUBLE
-- All timestamps: UTC (display converted via users.timezone)
-- Soft-delete: deleted_at / archived_at on historical tables
-- ============================================================

-- ----------------------------------------------------------------
-- 1. users
-- Extends auth.users via UUID FK.
-- Populated automatically by trigger in 002_rls_and_triggers.sql.
-- Fields managed by Supabase Auth (email, password) are NOT here.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT '',
  currency         TEXT NOT NULL DEFAULT 'PHP',
  timezone         TEXT NOT NULL DEFAULT 'Asia/Manila',
  locale           TEXT NOT NULL DEFAULT 'en-PH',
  pin_hash         TEXT,                          -- nullable, bcrypt hash for app lock
  biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 2. user_preferences
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  theme                 TEXT NOT NULL DEFAULT 'system'    CHECK (theme IN ('light', 'dark', 'system')),
  date_format           TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  first_day_of_month    INTEGER NOT NULL DEFAULT 1        CHECK (first_day_of_month BETWEEN 1 AND 28),
  budget_rollover       BOOLEAN NOT NULL DEFAULT FALSE,   -- Decision Log #6
  default_budget_method TEXT NOT NULL DEFAULT 'custom'   CHECK (default_budget_method IN ('50/30/20', 'zero-based', 'custom')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ----------------------------------------------------------------
-- 3. accounts
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'e-wallet', 'credit_card', 'other')),
  balance     DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,                        -- soft delete, keep for historical transactions
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 4. categories
-- user_id is NOT NULL (Decision Log #12 — cloned per user, no global nulls)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  group_name  TEXT CHECK (group_name IN ('needs', 'wants', 'financial')), -- nullable for income
  icon        TEXT,
  color       TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,                        -- soft delete — Decision Log #4
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 5. transactions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id               UUID NOT NULL REFERENCES public.accounts(id),
  category_id              UUID REFERENCES public.categories(id),  -- nullable for transfers
  type                     TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount                   DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  date                     DATE NOT NULL,
  description              TEXT,
  payment_method           TEXT,
  transfer_id              UUID,                   -- FK set after transfers table created (see below)
  recurring_transaction_id UUID,                  -- FK set after recurring_transactions table created
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ             -- soft delete
);

-- ----------------------------------------------------------------
-- 6. receipts (Decision Log #8 — object storage, metadata only)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receipts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  storage_key       TEXT NOT NULL,                -- server-generated, never trust original filename
  original_filename TEXT NOT NULL,
  mime_type         TEXT NOT NULL,                -- validated against actual file signature
  file_size         INTEGER NOT NULL,             -- bytes, max 10MB enforced at upload
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 7. recurring_transactions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES public.accounts(id),
  category_id       UUID REFERENCES public.categories(id),
  type              TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount            DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  frequency         TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'yearly')),
  start_date        DATE NOT NULL,
  end_date          DATE,                         -- nullable, ongoing if null
  next_run_date     DATE NOT NULL,
  last_generated_at TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 8. budgets (Decision Log #6 — rollover_in)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER NOT NULL CHECK (year >= 2000),
  amount      DECIMAL(14,2) NOT NULL CHECK (amount >= 0),
  rollover_in DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (rollover_in >= 0), -- positive only; Decision Log #6
  group_name  TEXT CHECK (group_name IN ('needs', 'wants', 'financial')), -- denormalized from category
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category_id, month, year)
);

-- ----------------------------------------------------------------
-- 9. bills (Decision Log #1 — partial payments)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bills (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES public.categories(id),
  name                TEXT NOT NULL,
  original_amount     DECIMAL(14,2) NOT NULL CHECK (original_amount > 0),
  paid_amount         DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_date            DATE NOT NULL,
  recurring           BOOLEAN NOT NULL DEFAULT FALSE,
  frequency           TEXT CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly', 'yearly')),
  status              TEXT NOT NULL DEFAULT 'UNPAID'
                        CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE')),
  reminder_days_before JSONB,                     -- e.g. [7, 3, 1]
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- remaining_amount is computed: original_amount - paid_amount (NOT stored)
);

-- ----------------------------------------------------------------
-- 10. bill_payments (Decision Log #1)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id        UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  account_id     UUID NOT NULL REFERENCES public.accounts(id),
  transaction_id UUID REFERENCES public.transactions(id), -- linked expense transaction
  amount         DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  date           DATE NOT NULL,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 11. goals (Decision Log #7 — completion status)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  icon           TEXT,
  target_amount  DECIMAL(14,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date    DATE,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  completed_at   TIMESTAMPTZ,                     -- set when current_amount >= target_amount
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 12. goal_contributions (Decision Log #7, Business Logic #4)
-- transaction_id NOT NULL after save — every contribution creates an expense
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id        UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  account_id     UUID NOT NULL REFERENCES public.accounts(id),
  transaction_id UUID REFERENCES public.transactions(id), -- mandatory after save (see BL #4)
  amount         DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  date           DATE NOT NULL,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 13. debts (Decision Log #2 — partial payments)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  original_amount  DECIMAL(14,2) NOT NULL CHECK (original_amount > 0),
  remaining_amount DECIMAL(14,2) NOT NULL CHECK (remaining_amount >= 0),
  minimum_payment  DECIMAL(14,2),
  due_date         DATE,
  interest_rate    DECIMAL(6,4),                  -- nullable, e.g. 0.0150 = 1.5%
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 14. debt_payments (Decision Log #2)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id        UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  account_id     UUID NOT NULL REFERENCES public.accounts(id),
  transaction_id UUID REFERENCES public.transactions(id), -- linked expense transaction
  amount         DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  date           DATE NOT NULL,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 15. transfers (Decision Log #11 — transfers ≠ income/expense)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id),
  to_account_id   UUID NOT NULL REFERENCES public.accounts(id),
  amount          DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  date            DATE NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_account_id <> to_account_id)
);

-- Now add the FK constraints on transactions that reference tables created after it
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_transfer
    FOREIGN KEY (transfer_id) REFERENCES public.transfers(id),
  ADD CONSTRAINT fk_transactions_recurring
    FOREIGN KEY (recurring_transaction_id) REFERENCES public.recurring_transactions(id);

-- ----------------------------------------------------------------
-- 16. notifications
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN (
                 'bill_reminder', 'budget_warning', 'goal_reminder',
                 'monthly_report', 'recurring_reminder'
               )),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  related_id   UUID,                              -- polymorphic: bill_id, goal_id, etc.
  related_type TEXT,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 17. monthly_reports (JSON snapshots — reflects past state)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month              INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year               INTEGER NOT NULL CHECK (year >= 2000),
  total_income       DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_expenses     DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_savings      DECIMAL(14,2) NOT NULL DEFAULT 0,
  savings_rate       DECIMAL(6,4),                -- e.g. 0.2000 = 20%
  top_categories     JSONB,                       -- snapshot of top spending categories
  budget_performance JSONB,                       -- snapshot of budget vs actual
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);

-- ----------------------------------------------------------------
-- 18. audit_logs (business-level trail — not auth session tracking)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,                     -- e.g. 'transaction.delete', 'budget.edit'
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  before_state JSONB,
  after_state  JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Indexes for common query patterns
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions (user_id, date DESC, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;                       -- cursor-based pagination (Decision Log #9)

CREATE INDEX IF NOT EXISTS idx_transactions_account
  ON public.transactions (account_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_category
  ON public.transactions (category_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budgets_user_month
  ON public.budgets (user_id, year, month);

CREATE INDEX IF NOT EXISTS idx_bills_user_due
  ON public.bills (user_id, due_date);

CREATE INDEX IF NOT EXISTS idx_goals_user_status
  ON public.goals (user_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read, scheduled_for)
  WHERE is_read = FALSE;
