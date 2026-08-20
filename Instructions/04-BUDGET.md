# BudgetPlan — Budget Module

## Budget Overview
Display selected month and:
- Monthly income
- Total allocated
- Total spent
- Unallocated amount

## Category Groups
### Needs
Housing, food, utilities, transportation, healthcare.

### Wants
Shopping, entertainment, dining, hobbies, travel.

### Financial
Savings, emergency fund, investments, debt.

## Category Row
Each category should show:
```text
Category
Spent / Budget
Progress
Remaining
```

## Category Detail
Include:
- Budget amount
- Spent amount
- Remaining amount
- Usage percentage
- Transactions
- Edit Budget
- Add Expense

## Zero-Based Budget
Formula:
```text
Income
- Needs
- Wants
- Savings
- Debt
= 0
```

Show whether the budget is fully allocated.

## Budget Rollover
> Full rules in Decision Log #6 — this section is a summary only.

Controlled by `user_preferences.budget_rollover` (off by default).

When enabled:
```text
IF category_spent < category_budget (previous month):
    rollover_in = category_budget - category_spent   -- positive unspent rolls forward
ELSE:
    rollover_in = 0   -- overspending NEVER carries forward as negative
```

- Budget health and usage % are calculated against `budget + rollover_in`, not the raw monthly amount.
- `rollover_in` is a snapshot written at month rollover — never retroactively recalculated.
- Show the rollover amount as a visible line on the Budget Overview (e.g. "+₱800 rollover from last month").

## Monthly Navigation
Allow previous/next month and month picker.
