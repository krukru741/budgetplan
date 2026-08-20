-- ============================================================
-- BudgetPlan — Migration 004: Atomic Transaction RPCs
-- Decision Log: Phase 2 Database Authority for Balances
-- ============================================================

-- First, relax the amount constraint on transactions to allow negative amounts for transfers.
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_check CHECK (amount != 0);

-- ----------------------------------------------------------------
-- RPC: insert_transaction_v1
-- Handles Income and Expenses atomically.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.insert_transaction_v1(
  p_user_id UUID,
  p_account_id UUID,
  p_category_id UUID,
  p_type TEXT,
  p_amount DECIMAL(14,2),
  p_date DATE,
  p_description TEXT,
  p_payment_method TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_category_type TEXT;
BEGIN
  -- 1. Validate Transaction Type
  IF p_type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION 'Invalid transaction type. Use insert_transfer_v1 for transfers.';
  END IF;

  -- 2. Validate Category Ownership and Type
  SELECT type INTO v_category_type
  FROM public.categories
  WHERE id = p_category_id AND user_id = p_user_id AND archived_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Category not found or archived.';
  END IF;

  IF v_category_type != p_type THEN
    RAISE EXCEPTION 'Category type (%) does not match transaction type (%).', v_category_type, p_type;
  END IF;

  -- 3. Validate Account Ownership
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_account_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Account not found.';
  END IF;

  -- 4. Insert Transaction (Amount must be strictly positive for income/expense)
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0 for income and expenses.';
  END IF;

  INSERT INTO public.transactions (
    user_id, account_id, category_id, type, amount, date, description, payment_method
  ) VALUES (
    p_user_id, p_account_id, p_category_id, p_type, p_amount, p_date, p_description, p_payment_method
  ) RETURNING id INTO v_transaction_id;

  -- 5. Update Account Balance
  IF p_type = 'income' THEN
    UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_account_id;
  ELSIF p_type = 'expense' THEN
    UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_account_id;
  END IF;

  RETURN v_transaction_id;
END;
$$;


-- ----------------------------------------------------------------
-- RPC: insert_transfer_v1
-- Handles Transfers atomically (2 legs).
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.insert_transfer_v1(
  p_user_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount DECIMAL(14,2),
  p_date DATE,
  p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer_id UUID;
BEGIN
  -- 1. Validate Accounts
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same account.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_from_account_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Source account not found.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_to_account_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Destination account not found.';
  END IF;

  -- 2. Validate Amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be strictly positive.';
  END IF;

  -- 3. Generate shared transfer ID
  v_transfer_id := gen_random_uuid();

  -- 4. Insert Outflow (Leg 1)
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, date, description, transfer_id
  ) VALUES (
    p_user_id, p_from_account_id, 'transfer', -p_amount, p_date, p_description, v_transfer_id
  );

  -- 5. Insert Inflow (Leg 2)
  INSERT INTO public.transactions (
    user_id, account_id, type, amount, date, description, transfer_id
  ) VALUES (
    p_user_id, p_to_account_id, 'transfer', p_amount, p_date, p_description, v_transfer_id
  );

  -- 6. Update Balances
  UPDATE public.accounts SET balance = balance - p_amount WHERE id = p_from_account_id;
  UPDATE public.accounts SET balance = balance + p_amount WHERE id = p_to_account_id;

  RETURN v_transfer_id;
END;
$$;
