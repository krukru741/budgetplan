import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react'

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

  // Group transfer legs into a single UI item
  const displayItems: any[] = []
  const transferMap = new Map()

  if (transactions) {
    for (const tx of transactions) {
      if (tx.type === 'transfer' && tx.transfer_id) {
        if (!transferMap.has(tx.transfer_id)) {
          transferMap.set(tx.transfer_id, { ...tx, legs: [tx] })
          displayItems.push(transferMap.get(tx.transfer_id))
        } else {
          transferMap.get(tx.transfer_id).legs.push(tx)
        }
      } else {
        displayItems.push(tx)
      }
    }
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Transactions</h1>
          <p className="text-text-secondary mt-1">Your recent financial activity</p>
        </div>
        <Link 
          href="/transactions/add"
          className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {displayItems.length === 0 ? (
          <div className="card border-dashed p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-surface-raised text-text-tertiary flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-text mb-1">No transactions yet</h3>
            <p className="text-text-secondary mb-6">Start tracking your expenses and income.</p>
            <Link 
              href="/transactions/add"
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors"
            >
              Add your first transaction
            </Link>
          </div>
        ) : (
          displayItems.map((item) => {
            if (item.type === 'transfer') {
              // Extract from/to from legs
              const outflow = item.legs.find((l: any) => l.amount < 0)
              const inflow = item.legs.find((l: any) => l.amount > 0)
              const transferAmount = inflow ? inflow.amount : (outflow ? Math.abs(outflow.amount) : 0)
              
              return (
                <div key={item.transfer_id} className="card p-4 flex items-center justify-between hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-info-light text-info flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-text leading-tight mb-1">
                        Transfer
                      </div>
                      <div className="text-xs text-text-secondary">
                        {outflow?.account?.name || 'Unknown'} → {inflow?.account?.name || 'Unknown'}
                        <span className="mx-2">•</span>
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text tabular-nums">
                      ₱{Number(transferAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )
            }

            // Normal Income/Expense
            const isExpense = item.type === 'expense'
            return (
              <div key={item.id} className="card p-4 flex items-center justify-between hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isExpense ? 'bg-danger-light text-danger' : 'bg-success-light text-success'
                  }`}>
                    <span className="text-lg">{item.category?.icon || (isExpense ? <TrendingDown className="w-5 h-5"/> : <TrendingUp className="w-5 h-5"/>)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-text leading-tight mb-1">
                      {item.category?.name || 'Uncategorized'}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {item.account?.name}
                      <span className="mx-2">•</span>
                      {new Date(item.date).toLocaleDateString()}
                      {item.description && <><span className="mx-2">•</span>{item.description}</>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold tabular-nums ${isExpense ? 'amount-negative' : 'text-success'}`}>
                    {isExpense ? '-' : '+'}₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
