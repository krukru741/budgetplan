# BudgetPlan — Decision Log

> This file is authoritative. Where any other spec file is silent or ambiguous, this file wins. Antigravity (or any dev/agent) should not invent behavior for the topics below — implement exactly as specified here.

---

## 1. Partial Payments — Bills

**Allowed.** Bills accumulate payments rather than requiring one lump sum.

```text
paid_amount        = SUM of all payments made against this bill
remaining_amount   = original_amount - paid_amount
```

**Status values:**
| Status | Condition |
|---|---|
| UNPAID | paid_amount = 0 |
| PARTIALLY_PAID | 0 < paid_amount < original_amount |
| PAID | remaining_amount = 0 |
| OVERDUE | due_date has passed AND remaining_amount > 0 |

Rules:
- Every payment (partial or full) creates an **expense transaction**.
- The bill itself is never counted as a second, separate expense when it reaches PAID — the expense already happened at the transaction level.
- A bill can receive multiple payments over time; each is logged.

## 2. Partial Payments — Debts

**Allowed**, same mechanism as bills:
```text
remaining_debt = previous_remaining - payment_amount
```
Each payment creates a row in `debt_payments` and an associated expense transaction. Debt `status` becomes `paid_off` when `remaining_amount` reaches 0.

## 3. Multiple Income Sources + Safe-to-Spend

All confirmed/actual income within the selected period is summed:
```text
Total Available Income = Salary + Freelance + Business + Other Income
```

Safe-to-Spend is split into **two values** so the user never mistakes future income for spendable cash:

```text
Current Safe-to-Spend
= Current Available Money
- Unpaid Bills
- Planned Savings
- Reserved Budget

Projected Safe-to-Spend
= Current Safe-to-Spend
+ Confirmed Expected Income (not yet received)
```

**UI requirement:** Dashboard shows Current Safe-to-Spend as the primary number. Projected Safe-to-Spend is shown as a secondary, clearly-labeled figure (e.g. "₱6,250 Safe to Spend · ₱11,250 projected after next salary"). Never merge the two into a single number.

## 4. Archived Category with Existing Bills/Transactions

**Never cascade-delete a category's financial history.**

| Data | On archive |
|---|---|
| Existing transactions | KEEP, untouched |
| Existing historical budgets | KEEP, untouched |
| Existing bills using this category | KEEP, continue functioning |
| New transactions with this category | BLOCKED |
| New bills with this category | BLOCKED |
| Editing an existing bill that has an archived category | User must select an active category before saving |

Archiving is a UI-level restriction (hide from pickers), not a data deletion.

## 5. Authentication Flow

```text
Register
  → Email Verification
    → Verified?
        No  → Verification Pending screen (Resend email available)
        Yes → Session created automatically
                → App (Dashboard) + Welcome toast
                    → Session Expired?
                        No  → App
                        Yes → Login
```

> **Auto-login after verification:** clicking the email verification link automatically creates a session. The user does NOT have to log in again manually after verifying. This is locked behavior — do not implement a manual re-login redirect.

**Password reset:**
```text
Forgot Password
  → Enter Email
  → Send Reset Link
  → Open Token (from email)
  → Validate Token
  → Set New Password
  → Invalidate all existing sessions
  → Login
```

## 6. Budget Rollover

**Only unspent positive budget rolls over. Overspending never creates a negative rollover.**

```text
Example — underspend:
Budget = ₱5,000, Spent = ₱4,200 → Rollover = ₱800
Next month available = ₱5,000 (new budget) + ₱800 (rollover) = ₱5,800

Example — overspend:
Budget = ₱5,000, Spent = ₱5,500 → Rollover = ₱0
(the -₱500 does NOT carry into next month)
```
This behavior is gated behind `user_preferences.budget_rollover` (boolean) — off by default unless the user enables it in Settings. A future "overspending carries forward as debt" feature is explicitly out of scope until separately designed.

## 7. Goal Completion

When `current_amount >= target_amount`:
```text
status = COMPLETED
completed_at = now()
```
UI shows a "🎉 Goal Completed!" celebration state. The goal is **not** auto-deleted or auto-archived — it moves to a "Completed Goals" section. User is offered: View Goal, Start a New Goal, Archive Goal.

## 8. Receipt Uploads

- Accepted formats: JPG, JPEG, PNG, WEBP, PDF
- Max size: 10 MB per receipt
- Files are stored in object storage (not the database); the database stores metadata only:
```text
receipts
  id
  transaction_id
  storage_key
  original_filename
  mime_type
  file_size
  uploaded_at
```
- Security: validate both MIME type and file signature (not just extension/filename), generate server-side storage names (never trust original filename), and enforce that a user can only access their own receipts.

## 9. Transaction List Pagination

Server-side **cursor-based** pagination, not offset pagination.
- Default page size: 25
- Sort order: `date DESC, created_at DESC, id DESC` (the `id` tiebreaker guarantees deterministic ordering when dates/timestamps collide)

## 10. Security Baseline

| Area | Rule |
|---|---|
| Passwords | **bcrypt via Supabase Auth** (default). Argon2id was originally specified but is not controllable when using Supabase's built-in auth — bcrypt is industry-standard and sufficient for this app. Do NOT implement custom password hashing on top of Supabase Auth. |
| Data in transit | HTTPS / TLS 1.2+ everywhere. |
| Sensitive data at rest | Authenticated encryption (AES-256-GCM) for sensitive fields. |
| PIN | Hashed separately from password using bcrypt, never stored plaintext. |
| PIN lockout | Progressive: 5 failed attempts → 1 min lock; 10 → 5 min lock; continued failures → longer lock. Successful auth resets the counter. |
| Sessions | Managed by **Supabase Auth internally** (`auth.sessions`, `auth.refresh_tokens`). The custom `sessions` table in the public schema is dropped — see Decision #11. |
| Password reset | Managed by **Supabase Auth** (magic link / OTP). The custom `password_reset_tokens` table is dropped — see Decision #11. |

---

## Cross-References — files this decision log overrides/extends

| Topic | Also update in |
|---|---|
| Partial payments, bill/debt status | `13-DATABASE-SCHEMA.md`, `14-BUSINESS-LOGIC.md` |
| Safe-to-Spend split | `03-HOME-DASHBOARD.md`, `14-BUSINESS-LOGIC.md`, `19-UI-COMPONENTS.md` |
| Archived category | `13-DATABASE-SCHEMA.md`, `04-BUDGET.md` |
| Auth flow, password reset | `15-USER-FLOWS.md`, `18-ANTIGRAVITY-INSTRUCTIONS.md` |
| Budget rollover | `04-BUDGET.md`, `14-BUSINESS-LOGIC.md`, `11-PROFILE-SETTINGS.md` |
| Goal completion | `07-GOALS.md`, `19-UI-COMPONENTS.md` |
| Receipt uploads | `13-DATABASE-SCHEMA.md`, `05-TRANSACTIONS.md` |
| Pagination | `05-TRANSACTIONS.md` |
| Security baseline | `11-PROFILE-SETTINGS.md`, `18-ANTIGRAVITY-INSTRUCTIONS.md` |
| Tech stack + auth table delegation | `13-DATABASE-SCHEMA.md`, `18-ANTIGRAVITY-INSTRUCTIONS.md` |

**Rule for Antigravity:** if any other spec file conflicts with this document, this document wins. Do not silently reconcile conflicts — flag them.

---

## 11. Tech Stack Lock + Auth Table Delegation

**Locked stack (do not deviate without updating this log):**

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) as a PWA — single codebase for web + installable mobile |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (built-in) |
| Object Storage | Supabase Storage (receipts) |
| Styling | Tailwind CSS + shadcn/ui |
| Global State | Zustand |
| Server State | TanStack Query (React Query) |
| Charts | Recharts |
| Deployment | Vercel |

**Auth table delegation — Conflict #2 resolution:**

The public schema's custom `sessions` and `password_reset_tokens` tables are **dropped**. Supabase Auth manages sessions and password reset internally via its own `auth.*` schema (`auth.sessions`, `auth.refresh_tokens`, `auth.users`). Reasons:
- Maintaining a parallel session store creates a dual source of truth that will drift.
- Supabase's built-in password reset (OTP/magic link) already satisfies the flow in Decision #5.
- Session security rules (HttpOnly, SameSite, rotation, logout invalidation) are enforced by Supabase Auth natively.

**What stays in the public schema:**
- `audit_logs` — kept for *business-level* audit trail (transaction deletes, budget edits, etc.), which is separate from auth session management.
- `users` — kept as a profile table that extends `auth.users` via a `id` FK. It holds app-level fields (`currency`, `timezone`, `locale`, `pin_hash`, `biometric_enabled`) that Supabase Auth does not manage.

**Implementation note for Antigravity:**
- `users.id` must be a FK to `auth.users.id` (UUID), not a standalone auto-increment primary key.
- Create a Supabase trigger `on auth.users insert` to auto-insert the matching `public.users` row.
- Row-Level Security (RLS) on all public tables must use `auth.uid() = user_id` as the policy condition.

---

## 12. Default Categories — Clone per User (Option B)

**Decision:** Default categories are cloned per user at signup via the `on auth.users insert` trigger, NOT seeded as global `user_id = NULL` rows.

**Rationale:**
- Option A (NULL user_id global rows) would require an RLS exception (`user_id IS NULL OR auth.uid() = user_id`) on the `categories` table — breaking the pure `auth.uid() = user_id` policy locked in Decision #11.
- Option B keeps RLS 100% consistent across all tables. No exceptions.

**Implementation:**
- A `seed_default_categories()` function exists in the database containing the 10 default categories (Housing, Food, Utilities, Transportation, Healthcare, Shopping, Entertainment, Savings, Investments, Debt).
- The `on auth.users insert` trigger calls BOTH:
  1. Insert into `public.users` (profile row)
  2. Call `seed_default_categories(new_user_id)` — clones all defaults with the new user's UUID
- Each cloned category has `is_default = TRUE` to distinguish system defaults from user-created ones.
- Future changes to the default list do NOT retroactively update existing users' categories (each user owns their copy).
- `categories.user_id` remains `NOT NULL` — no exceptions.

| What | Where |
|---|---|
| Trigger function | `supabase/migrations/002_rls_and_triggers.sql` |
| Default category list | Inside `seed_default_categories()` function, same file |