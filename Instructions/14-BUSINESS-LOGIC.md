# BudgetPlan — Business Logic (Revised)

> This file implements the rules locked in `20-DECISION-LOG.md`. Where the two ever disagree, the Decision Log wins.

## Core Calculations

### Total Income
```text
SUM(all income transactions in the selected period)
```

### Total Expenses
```text
SUM(all expense transactions in the selected period)
```
> Transfers are excluded. See "Important Accounting Rules" below.

### Available Money
```text
Total Income - Total Expenses
```

### Budget Remaining
```text
Category Budget (+ rollover_in, if enabled) - Category Expenses
```

### Budget Usage
```text
Expenses / (Budget + rollover_in) × 100
```

### Savings Rate
```text
Savings / Income × 100
```

## Safe to Spend (revised — see Decision Log #3)

Two values are calculated, not one:

```text
Current Safe-to-Spend
= Current Available Money
- Unpaid Bills (remaining_amount, not original_amount)
- Planned Savings
- Reserved Budget

Projected Safe-to-Spend
= Current Safe-to-Spend
+ Confirmed Expected Income (not yet received)
```

**Rule:** Expected future income never silently becomes spendable. `Current Safe-to-Spend` is the number the app leads with; `Projected Safe-to-Spend` is always shown as a secondary, clearly-labeled figure.

**Multiple income sources:** all confirmed/actual income within the period is summed before being fed into the formula:
```text
Total Available Income = Salary + Freelance + Business + Other Income
```

## Budget Health
```text
0–69%   Healthy
70–89%  Approaching Limit
90–99%  Almost Exceeded
100%+   Over Budget
```
Usage % is calculated against `Budget + rollover_in` (see Budget Rollover below), not against the raw monthly budget amount, when rollover is enabled for the user.

## Budget Rollover (Decision Log #6)

Applies only when `user_preferences.budget_rollover = true`.

```text
IF category_spent < category_budget (previous month):
    rollover_in (this month) = category_budget - category_spent
ELSE:
    rollover_in (this month) = 0   -- overspending never carries forward as negative
```
This value is written to `budgets.rollover_in` when the new month's budget row is generated (see schema). It is never recalculated retroactively — it's a snapshot taken at month rollover.

## Bill Payment Logic (Decision Log #1)

```text
paid_amount        = SUM(bill_payments.amount for this bill)
remaining_amount   = original_amount - paid_amount

status:
  UNPAID          if paid_amount = 0
  PARTIALLY_PAID  if 0 < paid_amount < original_amount
  PAID            if remaining_amount = 0
  OVERDUE         if due_date < today AND remaining_amount > 0
```
Each payment (partial or full):
1. Creates a row in `bill_payments`.
2. Creates an expense transaction linked via `transaction_id`.
3. Updates `paid_amount` and re-evaluates `status`.

The bill is never counted as a *second* expense on top of its payment transactions — the expense already exists at the transaction level, so summing all transactions is what produces Total Expenses; the bill record itself is a tracker, not an additional ledger entry.

## Debt Payment Logic (Decision Log #2)

```text
remaining_amount = previous_remaining_amount - payment_amount
status = paid_off when remaining_amount reaches 0
```
Same pattern as bills: each payment creates a `debt_payments` row + linked expense transaction.

## Goal Contribution & Completion (Decision Log #7)

```text
current_amount += contribution.amount

IF current_amount >= target_amount:
    status = COMPLETED
    completed_at = now()
```
A completed goal is never auto-deleted or auto-archived. It moves into a "Completed Goals" view. The user can then: view it, start a new goal, or manually archive it.

**Goal contribution transaction rule (Issue #4 resolution):**
Every goal contribution MUST create a linked expense transaction in the `Savings` category:
- `goal_contributions.transaction_id` must be populated (non-null) after the contribution is saved.
- The contribution and the expense transaction are created together in a single database transaction (all-or-nothing).
- The expense transaction is what shows in Total Expenses and affects Safe-to-Spend — the `goal_contributions` record is the tracker, not an additional ledger entry.
- Never count both the goal contribution record and the linked expense transaction separately.

## Archived Categories (Decision Log #4)

Archiving a category is a **restriction on future use**, not a deletion:
- Historical transactions, budgets, and bills referencing the category are untouched and continue to display normally.
- The category is removed from pickers for new transactions and new bills.
- If an existing bill's category becomes archived, editing that bill requires selecting an active category before saving. The bill continues functioning (accepting payments, tracking due dates) in the meantime.

## Important Accounting Rules
1. Transfers do not count as income or expenses. They are stored in the `transfers` table and referenced from `transactions` via `transfer_id` for account-balance purposes only.
2. Savings contributions must not be double-counted (a goal contribution is either its own transaction or linked via `goal_contributions.transaction_id` — never both counted separately in Total Expenses).
3. Bill and debt payments create expense transactions as described above — never a duplicate ledger entry.
4. Recurring transactions are generated consistently via `recurring_transactions.next_run_date`; each generated instance links back via `transactions.recurring_transaction_id`.
5. Deleted transactions must update all dependent totals (budgets, bill/debt paid_amount if linked, account balances).
6. Editing a transaction must recalculate affected budgets and, if linked, the parent bill/debt's `paid_amount`.
7. Monthly totals are calculated using the user's selected month **and** `users.timezone` — a transaction timestamped 11:58 PM local time must not be attributed to the next calendar day in UTC.
8. Currency formatting must respect `users.currency` throughout — no hardcoded currency symbols in the UI layer.
9. All monetary values are stored as `DECIMAL(14,2)` — never floating point — to avoid rounding drift across repeated calculations.

## Data Integrity
Use database transactions (all-or-nothing) when:
- Creating an expense + updating account balance
- Creating a transfer between two accounts
- Adding a goal contribution + updating goal `current_amount`
- Recording a debt or bill payment + updating `remaining_amount`/`paid_amount` + creating the linked expense transaction