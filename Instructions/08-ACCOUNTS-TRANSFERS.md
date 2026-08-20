# BudgetPlan — Accounts and Transfers

## Accounts
Users can create:
- Cash
- Bank
- E-wallet
- Credit Card
- Other

## Account List
Show:
- Account name
- Type
- Current balance

## Transfer
Fields:
- From account
- To account
- Amount
- Date
- Note

## Important Rule
A transfer must change account balances but must NOT increase expenses or income.

Example:
```text
GCash ₱10,000
→ transfer ₱5,000
→ Bank ₱5,000

Total net money remains unchanged.
```
