import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetClient from './BudgetClient'

export const metadata = { title: 'Budget | BudgetPlan' }

export default async function BudgetPage(props: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const month = searchParams.month ? parseInt(searchParams.month) : currentMonth
  const year = searchParams.year ? parseInt(searchParams.year) : currentYear

  // Fetch budget data from RPC
  const { data: budgets, error: budgetError } = await supabase.rpc('get_monthly_budget', {
    p_month: month,
    p_year: year
  })

  // Fetch total income for this month
  const { data: incomeTx } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('type', 'income')
    .is('deleted_at', null)
    .gte('date', `${year}-${month.toString().padStart(2, '0')}-01`)
    .lt('date', month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`)

  const totalIncome = incomeTx?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0
  
  // Totals
  const totalBudgeted = budgets?.reduce((sum: number, b: any) => sum + Number(b.budget_amount), 0) || 0
  const totalSpent = budgets?.reduce((sum: number, b: any) => sum + Number(b.spent_amount), 0) || 0
  const unallocated = totalIncome - totalBudgeted

  return (
    <BudgetClient
      month={month}
      year={year}
      budgets={budgets || []}
      totals={{
        income: totalIncome,
        budgeted: totalBudgeted,
        spent: totalSpent,
        unallocated
      }}
    />
  )
}
