import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TransactionsClient from './TransactionsClient'

export const metadata = { title: 'Transactions | BudgetPlan' }

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch transactions with related categories and accounts
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id, type, amount, date, description, transfer_id, created_at,
      category:categories(name, icon),
      account:accounts(name)
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50) // Basic limit for Phase 2, pagination later

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
    <TransactionsClient 
      initialTransactions={transactions as any} 
      accounts={accounts || []}
      categories={categories || []}
    />
  )
}
