-- ==============================================================================
-- 006_bills_rpc.sql
-- Implements Bill Payment logic and updates Safe-to-Spend (Phase 4)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Redefine get_safe_to_spend to subtract unpaid bills
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_safe_to_spend()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_month INT;
  v_current_year INT;
  v_total_available DECIMAL(14,2) := 0;
  v_reserved_budget DECIMAL(14,2) := 0;
  v_unpaid_bills DECIMAL(14,2) := 0;
  v_planned_savings DECIMAL(14,2) := 0;
  v_safe_to_spend DECIMAL(14,2) := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- 1. Total Available Money (Sum of all active account balances)
  SELECT COALESCE(SUM(balance), 0)
  INTO v_total_available
  FROM public.accounts
  WHERE user_id = v_user_id AND archived_at IS NULL;

  -- 2. Reserved Budget (MAX(Effective Budget - Spent, 0) across all categories for this month)
  SELECT COALESCE(SUM(GREATEST(0, (b.amount + b.rollover_in) - COALESCE(spent.total_spent, 0))), 0)
  INTO v_reserved_budget
  FROM public.budgets b
  LEFT JOIN (
    SELECT category_id, SUM(amount) AS total_spent
    FROM public.transactions
    WHERE user_id = v_user_id
      AND type = 'expense'
      AND deleted_at IS NULL
      AND EXTRACT(MONTH FROM date) = v_current_month
      AND EXTRACT(YEAR FROM date) = v_current_year
    GROUP BY category_id
  ) spent ON b.category_id = spent.category_id
  WHERE b.user_id = v_user_id
    AND b.month = v_current_month
    AND b.year = v_current_year;

  -- 3. Unpaid Bills
  -- Sum of (original_amount - paid_amount) for all bills that are not PAID
  SELECT COALESCE(SUM(original_amount - paid_amount), 0)
  INTO v_unpaid_bills
  FROM public.bills
  WHERE user_id = v_user_id
    AND status != 'PAID';

  -- 4. Planned Savings (Phase 5 Placeholder)
  v_planned_savings := 0;

  -- 5. Calculate Current Safe-to-Spend
  v_safe_to_spend := v_total_available - v_reserved_budget - v_unpaid_bills - v_planned_savings;

  RETURN json_build_object(
    'current_safe_to_spend', v_safe_to_spend,
    'projected_safe_to_spend', v_safe_to_spend, -- Phase 6 placeholder
    'total_available_money', v_total_available,
    'reserved_budget', v_reserved_budget,
    'unpaid_bills', v_unpaid_bills,
    'planned_savings', v_planned_savings
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. pay_bill RPC
-- Handles partial/full payments and auto-generates recurring instances (Option A)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pay_bill(
  p_bill_id UUID,
  p_account_id UUID,
  p_amount DECIMAL(14,2),
  p_date DATE,
  p_note TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_bill RECORD;
  v_tx_id UUID;
  v_new_paid_amount DECIMAL(14,2);
  v_new_status TEXT;
  v_next_due_date DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- Fetch and lock the bill
  SELECT * INTO v_bill
  FROM public.bills
  WHERE id = p_bill_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found or access denied';
  END IF;

  -- Calculate new paid amount
  v_new_paid_amount := v_bill.paid_amount + p_amount;

  IF v_new_paid_amount > v_bill.original_amount THEN
    RAISE EXCEPTION 'Payment exceeds the remaining bill amount';
  END IF;

  -- Determine new status
  IF v_new_paid_amount >= v_bill.original_amount THEN
    v_new_status := 'PAID';
  ELSE
    IF v_bill.due_date < CURRENT_DATE THEN
      v_new_status := 'OVERDUE';
    ELSE
      v_new_status := 'PARTIALLY_PAID';
    END IF;
  END IF;

  -- 1. Create the Expense Transaction
  INSERT INTO public.transactions (
    user_id, account_id, category_id, type, amount, date, description
  ) VALUES (
    v_user_id, p_account_id, v_bill.category_id, 'expense', p_amount, p_date, 
    COALESCE(p_note, 'Payment for ' || v_bill.name)
  ) RETURNING id INTO v_tx_id;

  -- The account balance is automatically reduced via the existing trigger `trg_update_account_balance`!

  -- 2. Create the Bill Payment record
  INSERT INTO public.bill_payments (
    bill_id, account_id, transaction_id, amount, date, note
  ) VALUES (
    p_bill_id, p_account_id, v_tx_id, p_amount, p_date, p_note
  );

  -- 3. Update the Bill
  UPDATE public.bills
  SET 
    paid_amount = v_new_paid_amount,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = p_bill_id;

  -- 4. If fully paid AND recurring, auto-generate the next bill instance (Option A)
  IF v_new_status = 'PAID' AND v_bill.recurring = TRUE AND v_bill.frequency IS NOT NULL THEN
    
    -- Calculate next due date based on frequency
    IF v_bill.frequency = 'daily' THEN
      v_next_due_date := v_bill.due_date + INTERVAL '1 day';
    ELSIF v_bill.frequency = 'weekly' THEN
      v_next_due_date := v_bill.due_date + INTERVAL '1 week';
    ELSIF v_bill.frequency = 'bi-weekly' THEN
      v_next_due_date := v_bill.due_date + INTERVAL '2 weeks';
    ELSIF v_bill.frequency = 'monthly' THEN
      v_next_due_date := v_bill.due_date + INTERVAL '1 month';
    ELSIF v_bill.frequency = 'yearly' THEN
      v_next_due_date := v_bill.due_date + INTERVAL '1 year';
    ELSE
      v_next_due_date := v_bill.due_date + INTERVAL '1 month'; -- fallback
    END IF;

    -- Create next bill
    INSERT INTO public.bills (
      user_id, category_id, name, original_amount, paid_amount, 
      due_date, recurring, frequency, status, reminder_days_before
    ) VALUES (
      v_user_id, v_bill.category_id, v_bill.name, v_bill.original_amount, 0,
      v_next_due_date, v_bill.recurring, v_bill.frequency, 'UNPAID', v_bill.reminder_days_before
    );

  END IF;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'new_status', v_new_status
  );
END;
$$;
