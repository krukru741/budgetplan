-- ==============================================================================
-- 007_debts_rpc.sql
-- Implements Debt Payment logic atomically (Decision Log #2)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.pay_debt(
  p_debt_id UUID,
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
  v_debt RECORD;
  v_tx_id UUID;
  v_category_id UUID;
  v_new_remaining DECIMAL(14,2);
  v_new_status TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- Fetch and lock the debt
  SELECT * INTO v_debt
  FROM public.debts
  WHERE id = p_debt_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Debt not found or access denied';
  END IF;

  -- Calculate new remaining amount
  v_new_remaining := v_debt.remaining_amount - p_amount;

  IF v_new_remaining < 0 THEN
    RAISE EXCEPTION 'Payment exceeds the remaining debt amount';
  END IF;

  -- Determine new status
  IF v_new_remaining = 0 THEN
    v_new_status := 'paid_off';
  ELSE
    v_new_status := 'active';
  END IF;

  -- Fetch the default 'Debt' category
  SELECT id INTO v_category_id
  FROM public.categories
  WHERE user_id = v_user_id AND name = 'Debt' AND type = 'expense'
  LIMIT 1;

  -- Fallback if the user somehow deleted the default 'Debt' category
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id
    FROM public.categories
    WHERE user_id = v_user_id AND type = 'expense'
    LIMIT 1;
  END IF;

  -- 1. Create the Expense Transaction
  INSERT INTO public.transactions (
    user_id, account_id, category_id, type, amount, date, description
  ) VALUES (
    v_user_id, p_account_id, v_category_id, 'expense', p_amount, p_date, 
    COALESCE(p_note, 'Payment for ' || v_debt.name)
  ) RETURNING id INTO v_tx_id;

  -- (The account balance is automatically reduced via the existing trigger `trg_update_account_balance`!)

  -- 2. Create the Debt Payment record
  INSERT INTO public.debt_payments (
    debt_id, account_id, transaction_id, amount, date, note
  ) VALUES (
    p_debt_id, p_account_id, v_tx_id, p_amount, p_date, p_note
  );

  -- 3. Update the Debt
  UPDATE public.debts
  SET 
    remaining_amount = v_new_remaining,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = p_debt_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'new_remaining', v_new_remaining,
    'status', v_new_status
  );
END;
$$;
