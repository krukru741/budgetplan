# BudgetPlan — Database Schema (Revised)

> Revision notes at the bottom explain what changed and why, so this can be diffed against the original `13-DATABASE-SCHEMA.md`.

## General Rules
- All monetary fields use `DECIMAL(14,2)` — never FLOAT/DOUBLE, to avoid rounding errors in financial math.
- All `*_at` fields are stored in UTC. Display conversion uses `users.timezone`.
- Soft-delete (`deleted_at`) is used on any table referenced by historical financial records, so history isn't broken when a user deletes a category/account.

---

## users
> Extends `auth.users` (Supabase). `id` is a UUID FK to `auth.users.id`, NOT a standalone auto-increment key.
> A Supabase trigger auto-inserts this row when a new `auth.users` record is created.
```text
id                     -- UUID, FK to auth.users.id
name
currency               -- default PHP
timezone               -- e.g. "Asia/Manila", used for monthly cutoffs
locale                 -- for date/number formatting
pin_hash               -- nullable, bcrypt hash for app lock
biometric_enabled      -- boolean
created_at
updated_at
```
> Fields managed by Supabase Auth (email, password_hash, email_verified_at) are NOT stored here — read them from `auth.users` when needed.

## user_preferences
```text
id
user_id
theme                  -- light / dark / system
date_format
first_day_of_month     -- int, default 1
budget_rollover        -- boolean: unspent budget carries to next month?
default_budget_method  -- 50/30/20 / zero-based / custom
created_at
updated_at
```

## accounts
```text
id
user_id
name
type                   -- cash / bank / e-wallet / credit_card / other
balance
is_default
archived_at            -- soft delete, keep for historical transactions
created_at
updated_at
```

## categories
```text
id
user_id
name
type                   -- income / expense
group                  -- needs / wants / financial (nullable for income)
icon
color
is_default             -- system-provided vs user-created
archived_at            -- soft delete, don't hard-delete if used in transactions
created_at
updated_at
```

## transactions
```text
id
user_id
account_id
category_id            -- nullable for transfers
type                   -- income / expense / transfer
amount
date
description
payment_method
transfer_id             -- nullable FK to transfers.id, only for type=transfer
recurring_transaction_id -- nullable FK, if generated from a recurring rule
created_at
updated_at
deleted_at
```

## receipts
```text
id
transaction_id
storage_key             -- server-generated, never trust original filename
original_filename
mime_type                -- validated against actual file signature, not just extension
file_size                -- max 10MB enforced at upload
uploaded_at
```
> Files live in object storage, not the database. See Decision Log #8.

## recurring_transactions
```text
id
user_id
account_id
category_id
type                   -- income / expense
amount
frequency              -- daily / weekly / bi-weekly / monthly / yearly
start_date
end_date               -- nullable, ongoing if null
next_run_date
last_generated_at
is_active
created_at
updated_at
```

## budgets
```text
id
user_id
category_id
month
year
amount
rollover_in            -- unspent positive amount carried in from previous month; 0 if rollover disabled or previous month was overspent
group                  -- denormalized copy of category.group, for fast grouped queries
created_at
updated_at
```
> `rollover_in` is computed and written when a new month's budget is generated. See Decision Log #6 — only positive unspent amounts roll forward; overspending never produces a negative rollover.

## bills
```text
id
user_id
category_id
name
original_amount        -- renamed from "amount" for clarity vs. paid_amount
paid_amount             -- accumulates with each payment, default 0
due_date
recurring
frequency
status                 -- UNPAID / PARTIALLY_PAID / PAID / OVERDUE (see Decision Log #1)
reminder_days_before   -- e.g. [7,3,1], stored as JSON/array
created_at
updated_at
```
> `remaining_amount` is a computed field (`original_amount - paid_amount`), not stored.
> Each payment against a bill creates a row in `bill_payments` (below) AND an expense transaction — the bill itself is never separately counted as an expense.

## bill_payments
```text
id
bill_id
account_id
transaction_id          -- FK to the resulting expense transaction
amount
date
note
created_at
```

## goals
```text
id
user_id
name
icon
target_amount
current_amount
target_date
status                 -- active / completed / archived
completed_at           -- nullable, set when current_amount reaches target
created_at
updated_at
```

## goal_contributions
```text
id
goal_id
account_id             -- which account the money came from
transaction_id          -- nullable FK, links to the resulting transaction
amount
date
note
created_at
```

## debts
```text
id
user_id
name
original_amount
remaining_amount        -- decremented on each payment; reaches 0 → status = paid_off
minimum_payment
due_date
interest_rate           -- nullable
status                  -- active / paid_off
created_at
updated_at
```
> Partial payments allowed — see Decision Log #2 and `debt_payments` below.

## debt_payments
```text
id
debt_id
account_id
transaction_id          -- nullable FK, links to the resulting expense transaction
amount
date
note
created_at
```

## transfers
```text
id
user_id
from_account_id
to_account_id
amount
date
note
created_at
```
> `transactions` rows of type `transfer` reference this via `transfer_id`, generating two balance-affecting entries without touching income/expense totals.

## notifications
```text
id
user_id
type                   -- bill_reminder / budget_warning / goal_reminder / monthly_report / recurring_reminder
title
body
related_id             -- polymorphic reference (bill_id, goal_id, etc.)
related_type
is_read
scheduled_for
sent_at
created_at
```

## monthly_reports
```text
id
user_id
month
year
total_income
total_expenses
total_savings
savings_rate
top_categories          -- JSON snapshot
budget_performance       -- JSON snapshot
generated_at
```

## password_reset_tokens
> **DROPPED — Decision Log #11.** Delegated to Supabase Auth's built-in password reset (OTP/magic link via `auth.*`). Do not create this table.

## sessions
> **DROPPED — Decision Log #11.** Session management is handled by Supabase Auth internally (`auth.sessions`, `auth.refresh_tokens`). Do not create this table.
> For business-level audit trail, use `audit_logs` instead.

## audit_logs
```text
id
user_id
action                  -- e.g. "transaction.delete", "budget.edit"
entity_type
entity_id
before_state             -- JSON, nullable
after_state               -- JSON, nullable
created_at
```

---

## Revision Notes (what changed vs. original schema)

1. **Added `user_id.timezone`** — business logic requires monthly totals calculated per user timezone; original schema had no field for it.
2. **Promoted `notifications`, `recurring_transactions`, `user_preferences` from "future tables" to active tables** — these are already required by V2-phase features (bill reminders, recurring toggle, theme/language settings), so they need to exist before those modules are built, not after.
3. **Added `debt_payments` table** — original schema had no way to store debt payment history despite the Debts spec requiring it. Mirrors `goal_contributions`.
4. **Added `transaction_id` link on `bills` and `debt_payments`** — the "Mark as Paid → Create Expense" flow and payment history both need to trace back to the actual transaction record, which the original schema didn't support.
5. **Added `transfers` as its own table**, with `transactions.transfer_id` linking back — keeps the "transfers ≠ income/expense" rule enforceable at the schema level instead of relying only on `type='transfer'` filtering.
6. **Added `group` to `categories` and `budgets`** — Budget module requires grouping into Needs/Wants/Financial, which the original schema had no field for.
7. **Added `archived_at` / soft-delete fields** on `accounts` and `categories` — deleting a category or account that has historical transactions attached would otherwise break past reports.
8. **Added `receipt_url` on `transactions`** — "optional receipt" was mentioned in the spec but had no storage field.
9. **Added `goal.status` and `completed_at`** — spec never defined what happens when a goal is reached; this makes it explicit (active → completed → optionally archived).
10. **Added `budget_rollover` in `user_preferences`** — resolves the undefined "does unused budget roll over?" question as a per-user setting rather than hardcoded behavior.
11. **Specified `DECIMAL(14,2)`** for all money fields — prevents floating-point rounding bugs in financial calculations, a common real-world bug source.
12. **All timestamps UTC**, converted for display using `users.timezone` — keeps monthly cutoff logic consistent regardless of server location.
13. **Added `bill_payments` table + `paid_amount`/`original_amount` on `bills`** — implements partial bill payments per Decision Log #1.
14. **Added `receipts` table** (separate from `transactions.receipt_url`) — implements upload constraints per Decision Log #8.
15. **Added `rollover_in` on `budgets`** — implements Decision Log #6 (positive-only rollover).
16. **Added `password_reset_tokens` and `sessions` tables** — implements the auth flow and security baseline in Decision Log #5 and #10.

## Resolved (previously "Still Open" — see `20-DECISION-LOG.md`)
- Partial bill/debt payments → **allowed**, tracked via `bill_payments` / `debt_payments`.
- Multiple income sources → summed into Total Available Income; feeds Current vs. Projected Safe-to-Spend split.
- Archived category with existing bills → historical data kept, new usage blocked. No schema change needed beyond existing `archived_at`.

All decisions above are locked in `20-DECISION-LOG.md`. This file implements them; that file is the source of truth if they ever diverge.