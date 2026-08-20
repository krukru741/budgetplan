import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoalsClient from './GoalsClient'

export const metadata = { title: 'Goals & Savings | BudgetPlan' }

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all goals for the user
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch active accounts for the contribution modal
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, balance')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('name')

  return (
    <GoalsClient 
      initialGoals={goals || []} 
      accounts={accounts || []} 
    />
  )
}
