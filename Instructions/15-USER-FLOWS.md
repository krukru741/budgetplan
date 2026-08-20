# BudgetPlan — User Flows (Revised)

> Adds the authentication flows that were missing from the original spec. All other flows are unchanged from `15-USER-FLOWS.md` except where a linked bill/debt payment now creates a transaction (noted below). See `20-DECISION-LOG.md` for the underlying rules.

## Registration & Email Verification (new)
```text
Register (email, password, name)
→ Email Verification sent
→ Verification Pending screen
   ↓ (user clicks link in email)
→ Verified?
    No  → stay on Verification Pending, allow "Resend email"
    Yes → Session created automatically (no manual re-login required)
           → App (Dashboard)
           → Show "Welcome! Your account is ready." toast
```
> **Decision (Issue #5 resolution):** Clicking the verification link automatically creates a session and opens the app. The user is NOT redirected to a login screen after verification — that would be unnecessary friction for a new user.

## Login & Session (new)
```text
Login (email, password)
→ Session created
→ App
   ↓ (on each app open)
→ Session Expired?
    No  → App
    Yes → Login
```

## Forgot Password (new)
```text
Login screen
→ Forgot Password
→ Enter Email
→ Send Reset Link
→ (user opens email) → Open Token
→ Validate Token
    Invalid/Expired → Show error, offer to resend
    Valid → Set New Password
             → Invalidate all existing sessions
             → Login
```

## New User (unchanged)
```text
Launch
→ Welcome
→ Currency
→ Income
→ Budget Method
→ Categories
→ Goal
→ Dashboard
```

## Add Expense (unchanged)
```text
Home
→ Add
→ Expense
→ Amount
→ Category
→ Account
→ Save
→ Confirmation
→ Dashboard
```

## Create Budget (unchanged)
```text
Budget
→ Select Month
→ Add/Edit Category
→ Set Amount
→ Save
→ Budget Overview
```

## Pay Bill (revised — supports partial payment)
```text
Bills
→ Upcoming/Overdue Bill
→ Bill Detail
→ Enter Payment Amount (full or partial)
→ Confirm Payment
   → Create linked expense transaction
   → Update bill.paid_amount / status
→ Bill Detail (shows updated status: PARTIALLY_PAID or PAID)
```

## Pay Debt (new — mirrors Pay Bill)
```text
Debts
→ Debt
→ Debt Detail
→ Enter Payment Amount (full or partial)
→ Confirm Payment
   → Create linked expense transaction
   → Update debt.remaining_amount
   → If remaining_amount = 0 → status = paid_off
→ Debt Detail (shows updated remaining amount)
```

## Save Toward Goal (unchanged)
```text
Goals
→ Goal
→ Add Contribution
→ Amount
→ Account
→ Save
→ Update Goal
   → If current_amount >= target_amount:
       → status = COMPLETED
       → Show "🎉 Goal Completed!" state
```

## Goal Completed → Next Action (new)
```text
Goal Completed celebration screen
→ User chooses:
    View Goal → Goal Detail (now in "Completed Goals" list)
    Start a New Goal → Create Goal flow
    Archive Goal → Goal moves out of active list, history preserved
```

## Transfer Money (unchanged)
```text
Add
→ Transfer
→ From Account
→ To Account
→ Amount
→ Save
→ Update Both Balances
```
> Does not create an income or expense transaction — recorded in `transfers` table only.

## Category Archive (new)
```text
Settings/Categories
→ Category
→ Archive
→ Confirm (explains: historical data kept, no longer selectable for new items)
→ Category removed from "Add Transaction" / "Add Bill" pickers
   (existing bills/transactions referencing it continue to work)
```

## Monthly Review (unchanged)
```text
Home
→ Analytics
→ Monthly Report
→ Review Spending
→ Review Budget
→ Review Savings
→ Adjust Next Month
```