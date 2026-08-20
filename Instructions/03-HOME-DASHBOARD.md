# BudgetPlan — Home Dashboard

## Goal
The dashboard should answer: "Can I safely spend money right now?"

## Priority Order
1. Safe to Spend
2. Current Balance
3. Budget Health
4. Upcoming Bills
5. Category Budgets
6. Savings Goals
7. Recent Transactions

## Main Components

### Safe to Spend
> See Decision Log #3 — two values are always shown, never merged into one.

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

**UI rule:** Current Safe-to-Spend is the primary (large) number. Projected is shown as a clearly-labeled secondary figure, e.g. "₱6,250 Safe to Spend · ₱11,250 projected after next salary". Never merge the two.

### Balance Summary
Show:
- Available Balance
- Total Income
- Total Expenses
- Total Savings

### Budget Health
Statuses:
- 0–69%: Healthy
- 70–89%: Approaching Limit
- 90–99%: Almost Exceeded
- 100%+: Over Budget

### Upcoming Bills
Show bill name, amount, due date and status.

### Category Budget Cards
Show:
- Category
- Spent
- Budget
- Remaining
- Usage percentage
- Progress bar

### Savings Goals
Show goal progress and target date.

### Recent Transactions
Show latest income, expense and transfer records.

## Empty State
When there is no data:
- Explain what the user can do
- Provide Add Income and Add Expense CTAs
