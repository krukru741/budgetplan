# BudgetPlan — Antigravity Development Instructions (Revised)

## Project Goal
Build BudgetPlan according to the UI/UX, business logic, database and user-flow specifications in this folder.

## Source of Truth — Read in This Order
1. **`20-DECISION-LOG.md`** — read this FIRST. It locks every previously ambiguous rule (partial payments, Safe-to-Spend split, archived categories, auth flow, budget rollover, goal completion, receipts, pagination, security). If any other file conflicts with it, the Decision Log wins.
2. `00-PROJECT-OVERVIEW.md`
3. `01-APP-ARCHITECTURE.md`
4. `03-HOME-DASHBOARD.md`
5. `04-BUDGET.md`
6. `05-TRANSACTIONS.md`
7. `14-BUSINESS-LOGIC.md`
8. `13-DATABASE-SCHEMA.md`
9. `15-USER-FLOWS.md`
10. `16-FIGMA-SCREEN-INVENTORY.md`

## Implementation Rules
- Do not skip required screens.
- Do not invent conflicting business logic — every ambiguous case is already resolved in `20-DECISION-LOG.md`. If you encounter a decision that isn't covered there, stop and flag it rather than guessing.
- Keep financial calculations centralized and testable (one source of truth per formula — Safe-to-Spend, budget usage, bill/debt status, etc. — not recomputed differently in multiple components).
- Use reusable components.
- Keep UI responsive.
- Support loading, empty, error and success states.
- Do not expose raw technical/database errors to users.
- Do not count transfers as expenses.
- Bills and debts support **partial payments** — implement `paid_amount`/`remaining_amount` accumulation, not full-amount-only logic.
- Safe-to-Spend must show **Current** and **Projected** as two distinct values — never merge confirmed and expected income into one number.
- Archiving a category must never cascade-delete or hide historical records — only block new usage.
- Avoid duplicate financial calculations across components.
- Validate all monetary inputs; store as `DECIMAL(14,2)`, never floating point.
- Use proper date/time handling — monthly cutoffs respect `users.timezone`.
- Preserve the user's selected currency throughout the UI.
- Make destructive actions require confirmation.
- Follow the security baseline in Decision Log #10 exactly (**bcrypt via Supabase Auth**, TLS 1.2+, AES-256-GCM for sensitive-at-rest fields, progressive PIN lockout, session management delegated to Supabase Auth).
- Transaction lists use cursor-based pagination (`date DESC, created_at DESC, id DESC`), default page size 25 — not offset pagination.
- **Supabase-specific rules (Decision Log #11):**
  - `public.users.id` is a UUID FK to `auth.users.id` — never auto-increment.
  - Create a trigger `on auth.users insert` to auto-populate `public.users`.
  - All public tables must have Row-Level Security (RLS) enabled with `auth.uid() = user_id` policies.
  - Do NOT create `sessions` or `password_reset_tokens` tables — these are delegated to Supabase Auth.

## Recommended Build Order
```text
Foundation
→ Decision Log review (mandatory before any coding)
→ Authentication (incl. email verification, password reset, session handling)
→ Design System
→ Database
→ Accounts/Categories
→ Transactions (incl. receipts)
→ Budget Engine (incl. rollover)
→ Dashboard (incl. Current/Projected Safe-to-Spend)
→ Bills (incl. partial payments)
→ Debts (incl. partial payments)
→ Goals (incl. completion flow)
→ Analytics
→ Notifications
→ Settings
```

## Definition of Done
A module is not complete until:
- UI exists
- API/data layer exists
- Validation exists
- Loading state exists
- Empty state exists
- Error state exists
- Success state exists
- Mobile responsive behavior exists
- Business rules are tested
- **Behavior matches `20-DECISION-LOG.md` exactly** for any topic covered there (no silent reinterpretation)