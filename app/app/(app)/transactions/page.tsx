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

  return <TransactionsClient initialTransactions={transactions as any} />
}
