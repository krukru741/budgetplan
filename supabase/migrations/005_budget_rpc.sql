-- ============================================================
-- BudgetPlan — Migration 005: Budget Engine & Safe-to-Spend
-- Decision Log: Phase 3 Atomic Budget Math
-- ============================================================

-- ----------------------------------------------------------------
-- RPC: get_monthly_budget
-- Calculates budgets, spent, and rollover for a specific month.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_monthly_budget(
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  category_id UUID,
  name TEXT,
  group_name TEXT,
  icon TEXT,
  budget_amount DECIMAL(14,2),
  spent_amount DECIMAL(14,2),
  rollover_in DECIMAL(14,2),
  effective_budget DECIMAL(14,2),
  remaining_amount DECIMAL(14,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_prev_month INTEGER;
  v_prev_year INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Determine previous month/year for rollover calculation
  IF p_month = 1 THEN
    v_prev_month := 12;
    v_prev_year := p_year - 1;
  ELSE
    v_prev_month := p_month - 1;
    v_prev_year := p_year;
  END IF;

  RETURN QUERY
  WITH category_list AS (
    SELECT id, c.name, c.group_name, c.icon
    FROM public.categories c
    WHERE c.user_id = v_user_id AND c.type = 'expense' AND c.archived_at IS NULL
  ),
  current_budgets AS (
    SELECT b.category_id, b.amount
    FROM public.budgets b
    WHERE b.user_id = v_user_id AND b.month = p_month AND b.year = p_year
  ),
  prev_budgets AS (
    SELECT b.category_id, b.amount
    FROM public.budgets b
    WHERE b.user_id = v_user_id AND b.month = v_prev_month AND b.year = v_prev_year
  ),
  current_spent AS (
    SELECT t.category_id, COALESCE(SUM(t.amount), 0) as spent
    FROM public.transactions t
    WHERE t.user_id = v_user_id 
      AND t.type = 'expense' 
      AND t.deleted_at IS NULL
      AND EXTRACT(MONTH FROM t.date) = p_month 
      AND EXTRACT(YEAR FROM t.date) = p_year
    GROUP BY t.category_id
  ),
  prev_spent AS (
    SELECT t.category_id, COALESCE(SUM(t.amount), 0) as spent
    FROM public.transactions t
    WHERE t.user_id = v_user_id 
      AND t.type = 'expense' 
      AND t.deleted_at IS NULL
      AND EXTRACT(MONTH FROM t.date) = v_prev_month 
      AND EXTRACT(YEAR FROM t.date) = v_prev_year
    GROUP BY t.category_id
  )
  SELECT 
    cl.id AS category_id,
    cl.name,
    cl.group_name,
    cl.icon,
    COALESCE(cb.amount, 0) AS budget_amount,
    COALESCE(cs.spent, 0) AS spent_amount,
    -- Rollover logic: GREATEST(previous_budget - previous_spent, 0)
    -- TODO: In the future, check user_preferences.budget_rollover before applying this.
    -- For Phase 3, we assume rollover is active for all if they allocate.
    GREATEST(COALESCE(pb.amount, 0) - COALESCE(ps.spent, 0), 0) AS rollover_in,
    
    (COALESCE(cb.amount, 0) + GREATEST(COALESCE(pb.amount, 0) - COALESCE(ps.spent, 0), 0)) AS effective_budget,
    
    ((COALESCE(cb.amount, 0) + GREATEST(COALESCE(pb.amount, 0) - COALESCE(ps.spent, 0), 0)) - COALESCE(cs.spent, 0)) AS remaining_amount
  FROM category_list cl
  LEFT JOIN current_budgets cb ON cl.id = cb.category_id
  LEFT JOIN current_spent cs ON cl.id = cs.category_id
  LEFT JOIN prev_budgets pb ON cl.id = pb.category_id
  LEFT JOIN prev_spent ps ON cl.id = ps.category_id
  ORDER BY cl.group_name, cl.name;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: get_safe_to_spend
-- Calculates the globally available safe-to-spend amount.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_safe_to_spend()
RETURNS TABLE (
  total_available_money DECIMAL(14,2),
  reserved_budget DECIMAL(14,2),
  unpaid_bills DECIMAL(14,2),
  planned_savings DECIMAL(14,2),
  expected_future_income DECIMAL(14,2),
  current_safe_to_spend DECIMAL(14,2),
  projected_safe_to_spend DECIMAL(14,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total_available DECIMAL(14,2) := 0;
  v_reserved_budget DECIMAL(14,2) := 0;
  v_unpaid_bills DECIMAL(14,2) := 0;
  v_planned_savings DECIMAL(14,2) := 0;
  v_expected_income DECIMAL(14,2) := 0;
  v_current_month INTEGER;
  v_current_year INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- 1. Total Available Money (Sum of active accounts)
  SELECT COALESCE(SUM(balance), 0) INTO v_total_available
  FROM public.accounts
  WHERE user_id = v_user_id AND archived_at IS NULL;

  -- 2. Reserved Budget (Sum of positive remaining budgets for current month)
  SELECT COALESCE(SUM(GREATEST(remaining_amount, 0)), 0) INTO v_reserved_budget
  FROM public.get_monthly_budget(v_current_month, v_current_year);

  -- 3. Unpaid Bills (Phase 4 placeholder)
  v_unpaid_bills := 0;

  -- 4. Planned Savings (Phase 5 placeholder)
  v_planned_savings := 0;

  -- 5. Expected Future Income (Phase X placeholder)
  v_expected_income := 0;

  RETURN QUERY SELECT 
    v_total_available,
    v_reserved_budget,
    v_unpaid_bills,
    v_planned_savings,
    v_expected_income,
    (v_total_available - v_reserved_budget - v_unpaid_bills - v_planned_savings) AS current_safe_to_spend,
    (v_total_available - v_reserved_budget - v_unpaid_bills - v_planned_savings + v_expected_income) AS projected_safe_to_spend;
END;
$$;
