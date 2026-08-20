import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionForm from './TransactionForm'

export const metadata = { title: 'Add Transaction | BudgetPlan' }

export default async function AddTransactionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch active accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, balance')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('name')

  // Fetch active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, type, icon, group_name')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('name')

  return (
    <TransactionForm 
      accounts={accounts || []} 
      categories={categories || []} 
    />
  )
}
