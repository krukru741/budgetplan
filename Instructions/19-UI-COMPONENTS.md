# BudgetPlan — Reusable UI Components (Revised)

> Adds components/states required by `20-DECISION-LOG.md`. All original components from `19-UI-COMPONENTS.md` remain unchanged.

## Layout
- AppShell
- Sidebar
- BottomNavigation
- Header
- PageContainer
- SectionHeader

## Financial
- MoneyDisplay
- BalanceCard
- BudgetCard
- BudgetProgress
- **SafeToSpendCard** — must render two values: Current Safe-to-Spend (primary) and Projected Safe-to-Spend (secondary, clearly labeled, e.g. smaller text or "projected after next salary")
- IncomeCard
- ExpenseCard
- SavingsGoalCard
- **BillCard** — status badge must support four states: UNPAID / PARTIALLY_PAID / PAID / OVERDUE, not just paid/unpaid
- **BillPaymentInput** (new) — amount field for partial or full bill payment, shows remaining_amount after entry
- AccountCard
- **DebtCard** — same partial-payment status treatment as BillCard
- **DebtPaymentInput** (new) — mirrors BillPaymentInput
- TransactionRow
- **GoalCompletionCelebration** (new) — "🎉 Goal Completed!" state with three actions: View Goal, Start a New Goal, Archive Goal

## Forms
- MoneyInput
- CategorySelect — must exclude archived categories from the picker
- AccountSelect
- DatePicker
- FrequencySelect
- SearchInput
- FilterSheet
- NoteInput
- **ReceiptUpload** (new) — accepts JPG/JPEG/PNG/WEBP/PDF, 10MB max, client-side validation before upload

## Auth (new section)
- LoginForm
- RegisterForm
- **VerificationPendingState** — shown after registration, before email is verified; includes "Resend email" action
- ForgotPasswordForm
- ResetPasswordForm
- **SessionExpiredModal** — prompts re-login without losing in-progress form data where possible

## Feedback
- Toast
- Alert
- ConfirmationModal — used for destructive actions AND for category archive (explains historical data is kept)
- EmptyState
- ErrorState
- LoadingSkeleton
- SuccessState

## Charts
- SpendingLineChart
- CategoryDonutChart
- IncomeExpenseChart
- GoalProgressChart

## Rules
Components should be:
- Reusable
- Accessible
- Responsive
- Theme-aware
- Independent of page-specific business logic where possible
- **Status/badge components must never encode meaning through color alone** — always pair with a label (UNPAID/PARTIALLY_PAID/PAID/OVERDUE, not just a colored dot)