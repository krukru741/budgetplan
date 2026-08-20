'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowRightLeft, TrendingDown, TrendingUp, Receipt, Search } from 'lucide-react'
import Icon from '@/components/ui/Icon'

type Transaction = {
  id: string
  type: string
  amount: number
  date: string
  description: string
  transfer_id: string | null
  created_at: string
  category: { name: string, icon: string } | null
  account: { name: string } | null
}

export default function TransactionsClient({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [search, setSearch] = useState('')

  // Filter and Search logic
  const filteredTransactions = initialTransactions.filter(tx => {
    // Basic type filter
    if (filter !== 'all' && tx.type !== filter) return false
    
    // Text search
    if (search) {
      const query = search.toLowerCase()
      const matchName = tx.category?.name?.toLowerCase().includes(query) || false
      const matchDesc = tx.description?.toLowerCase().includes(query) || false
      const matchAccount = tx.account?.name?.toLowerCase().includes(query) || false
      if (!matchName && !matchDesc && !matchAccount) return false
    }
    
    return true
  })

  // Group transfer legs into a single UI item (from the filtered list)
  const displayItems: any[] = []
  const transferMap = new Map()

  for (const tx of filteredTransactions) {
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

  // Group by date
  const groupedByDate: Record<string, any[]> = {}
  
  displayItems.forEach(item => {
    // Format: "AUG 20, 2026"
    const dateStr = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    if (!groupedByDate[dateStr]) groupedByDate[dateStr] = []
    groupedByDate[dateStr].push(item)
  })

  // Calculate quick summary for the current view
  const totalInflow = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalOutflow = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="page-container animate-fade-in w-full max-w-7xl mx-auto pb-24 md:pb-8 flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1 w-full max-w-4xl">
        <div className="section-header flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Transactions</h1>
            <p className="text-text-secondary mt-1">Your recent financial activity</p>
          </div>
          <Link 
            href="/transactions/add"
            className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-[#54281f] transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </Link>
        </div>

        {/* Filters & Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-surface-raised p-1 rounded-xl w-full md:w-auto">
            {['all', 'income', 'expense', 'transfer'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t as any)}
                className={`flex-1 md:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-colors ${
                  filter === t 
                    ? 'bg-white text-primary shadow-sm' 
                    : 'text-text-secondary hover:text-text hover:bg-white/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-raised border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary transition-all text-primary placeholder-text-tertiary"
            />
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {displayItems.length === 0 ? (
            <div className="card border-dashed p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary-light/50 text-primary flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-primary mb-1">No transactions found</h3>
              <p className="text-text-secondary mb-6">Try adjusting your filters or search.</p>
              <Link 
                href="/transactions/add"
                className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-[#54281f] transition-colors"
              >
                Add transaction
              </Link>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateStr, items]) => (
              <div key={dateStr} className="space-y-3">
                <div className="sticky top-16 md:static z-10 py-1 bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none -mx-2 px-2">
                  <h3 className="px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-semibold w-fit tracking-wider shadow-sm">
                    {dateStr}
                  </h3>
                </div>
                {items.map((item) => {
                  if (item.type === 'transfer') {
                    const outflow = item.legs.find((l: any) => l.amount < 0)
                    const inflow = item.legs.find((l: any) => l.amount > 0)
                    const transferAmount = inflow ? inflow.amount : (outflow ? Math.abs(outflow.amount) : 0)
                    
                    return (
                      <div key={item.transfer_id} className="card p-4 flex items-center justify-between hover:border-primary/30 hover:bg-primary-light/10 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                            <ArrowRightLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-primary leading-tight mb-1">
                              Transfer
                            </div>
                            <div className="text-xs text-text-secondary">
                              {outflow?.account?.name || 'Unknown'} → {inflow?.account?.name || 'Unknown'}
                              {item.description && <span className="hidden sm:inline mx-2">• {item.description}</span>}
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

                  const isExpense = item.type === 'expense'
                  return (
                    <div key={item.id} className="card p-4 flex items-center justify-between hover:border-primary/30 hover:bg-primary-light/10 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                          {item.category?.icon ? <Icon name={item.category.icon} className="w-5 h-5" /> : (isExpense ? <TrendingDown className="w-5 h-5"/> : <TrendingUp className="w-5 h-5"/>)}
                        </div>
                        <div>
                          <div className="font-semibold text-primary leading-tight mb-1">
                            {item.category?.name || 'Uncategorized'}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {item.account?.name}
                            {item.description && <span className="hidden sm:inline mx-2">• {item.description}</span>}
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
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar - Summary Widget */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="card p-6 bg-primary-light/30 border-transparent shadow-sm">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">View Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-text-secondary mb-1">Total Inflow</div>
                <div className="text-xl font-bold text-success">+₱{totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="h-px w-full bg-primary/10"></div>
              <div>
                <div className="text-xs text-text-secondary mb-1">Total Outflow</div>
                <div className="text-xl font-bold text-danger">-₱{totalOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="h-px w-full bg-primary/10"></div>
              <div>
                <div className="text-xs text-text-secondary mb-1">Net Flow</div>
                <div className={`text-xl font-bold ${totalInflow - totalOutflow >= 0 ? 'text-primary' : 'text-danger'}`}>
                  {totalInflow - totalOutflow >= 0 ? '' : '-'}₱{Math.abs(totalInflow - totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
