-- ==============================================================================
-- 008_recurring_transactions.sql
-- Implements Recurring Transactions Engine (Smart RPC Hook approach)
-- ==============================================================================

-- 1. Create the recurring_transactions table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES public.accounts(id),
  category_id     UUID NOT NULL REFERENCES public.categories(id),
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount          DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  description     TEXT,
  frequency       TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date       DATE NOT NULL,
  end_date        DATE, -- Optional end date
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recurring transactions"
  ON public.recurring_transactions FOR ALL
  USING (auth.uid() = user_id);

-- 2. Create the Smart RPC Hook
CREATE OR REPLACE FUNCTION public.process_recurring_transactions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_rec RECORD;
  v_current_next_date DATE;
  v_inserted_count INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find all active recurring transactions that are due today or overdue
  FOR v_rec IN 
    SELECT * FROM public.recurring_transactions 
    WHERE user_id = v_user_id 
      AND status = 'active' 
      AND next_date <= CURRENT_DATE
  LOOP
    
    v_current_next_date := v_rec.next_date;

    -- Process all missed dates (catch-up logic)
    WHILE v_current_next_date <= CURRENT_DATE LOOP
      
      -- Insert the transaction
      -- Note: The existing trg_update_account_balance trigger will automatically 
      -- handle the account balance deduction/addition safely!
      INSERT INTO public.transactions (
        user_id, account_id, category_id, type, amount, date, description
      ) VALUES (
        v_rec.user_id, v_rec.account_id, v_rec.category_id, v_rec.type, 
        v_rec.amount, v_current_next_date, v_rec.description
      );

      v_inserted_count := v_inserted_count + 1;

      -- Calculate the next due date based on frequency
      IF v_rec.frequency = 'daily' THEN
        v_current_next_date := v_current_next_date + INTERVAL '1 day';
      ELSIF v_rec.frequency = 'weekly' THEN
        v_current_next_date := v_current_next_date + INTERVAL '1 week';
      ELSIF v_rec.frequency = 'monthly' THEN
        v_current_next_date := v_current_next_date + INTERVAL '1 month';
      ELSIF v_rec.frequency = 'yearly' THEN
        v_current_next_date := v_current_next_date + INTERVAL '1 year';
      END IF;

    END LOOP;

    -- Check if it has surpassed the optional end_date
    IF v_rec.end_date IS NOT NULL AND v_current_next_date > v_rec.end_date THEN
      UPDATE public.recurring_transactions
      SET next_date = v_current_next_date, status = 'completed', updated_at = NOW()
      WHERE id = v_rec.id;
    ELSE
      -- Update the recurring record with the new future next_date
      UPDATE public.recurring_transactions
      SET next_date = v_current_next_date, updated_at = NOW()
      WHERE id = v_rec.id;
    END IF;

  END LOOP;

  RETURN json_build_object(
    'success', true,
    'processed_count', v_inserted_count
  );
END;
$$;
