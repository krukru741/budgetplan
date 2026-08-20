import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DebtsClient from './DebtsClient'

export const metadata = { title: 'Debts | BudgetPlan' }

export default async function DebtsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch debts with payment history
  const { data: debts } = await supabase
    .from('debts')
    .select(`
      *,
      payments:debt_payments(
        id, amount, date, note,
        account:accounts(name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch accounts for paying debts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return (
    <DebtsClient 
      debts={debts || []} 
      accounts={accounts || []} 
    />
  )
}
