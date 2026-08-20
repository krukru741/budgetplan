import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export const metadata = { title: 'Analytics | BudgetPlan' }

export default async function AnalyticsPage(props: { searchParams: Promise<{ month?: string, year?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const month = searchParams.month ? parseInt(searchParams.month) : currentMonth
  const year = searchParams.year ? parseInt(searchParams.year) : currentYear

  // Fetch Safe-to-Spend
  const { data: safeToSpendData } = await supabase.rpc('get_safe_to_spend')

  // Fetch all transactions for the month (excluding transfers)
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id, amount, date, type, 
      category:categories(name, color, icon)
    `)
    .eq('user_id', user.id)
    .in('type', ['income', 'expense'])
    .is('deleted_at', null)
    .gte('date', `${year}-${month.toString().padStart(2, '0')}-01`)
    .lt('date', month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`)
    .order('date', { ascending: true })

  // Fetch budget vs actual
  const { data: budgets } = await supabase.rpc('get_monthly_budget', {
    p_month: month,
    p_year: year
  })

  return (
    <AnalyticsClient
      month={month}
      year={year}
      transactions={transactions || []}
      budgets={budgets || []}
      safeToSpend={safeToSpendData?.current_safe_to_spend || 0}
    />
  )
}
