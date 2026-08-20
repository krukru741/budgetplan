'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, ArrowRightLeft } from 'lucide-react'
import { addTransaction, addTransfer } from '../actions'

type Account = { id: string; name: string; type: string; balance: number }
type Category = { id: string; name: string; type: string; icon: string | null; group_name: string | null }

export default function TransactionForm({
  accounts,
  categories
}: {
  accounts: Account[]
  categories: Category[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [tab, setTab] = useState<'expense' | 'income' | 'transfer'>('expense')
  
  const activeCategories = categories.filter(c => c.type === tab)
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      if (tab === 'transfer') {
        await addTransfer(formData)
      } else {
        formData.set('type', tab)
        await addTransaction(formData)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction')
      setLoading(false)
    }
  }

  return (
    <div className="page-container animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/transactions" className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-raised transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-display font-bold text-text">New Transaction</h1>
      </div>

      <div className="card p-6 space-y-6">
        {/* Tabs */}
        <div className="flex bg-surface-raised p-1 rounded-xl">
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                tab === t 
                  ? t === 'expense' ? 'bg-danger text-white shadow-sm' 
                    : t === 'income' ? 'bg-success text-white shadow-sm' 
                    : 'bg-info text-white shadow-sm'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text mb-1.5">Amount (₱)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className={`input-base text-2xl font-display font-bold tabular-nums ${tab === 'expense' ? 'text-danger' : tab === 'income' ? 'text-success' : 'text-info'}`}
            />
          </div>

          {/* Transfer Accounts */}
          {tab === 'transfer' ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label htmlFor="from_account_id" className="block text-sm font-medium text-text mb-1.5">From Account</label>
                <select id="from_account_id" name="from_account_id" required className="input-base">
                  <option value="">Select source account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (₱{Number(a.balance).toLocaleString()})</option>)}
                </select>
              </div>
              <div className="pt-6 text-text-tertiary px-1"><ArrowRightLeft className="w-5 h-5" /></div>
              <div className="flex-1">
                <label htmlFor="to_account_id" className="block text-sm font-medium text-text mb-1.5">To Account</label>
                <select id="to_account_id" name="to_account_id" required className="input-base">
                  <option value="">Select destination account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (₱{Number(a.balance).toLocaleString()})</option>)}
                </select>
              </div>
            </div>
          ) : (
            /* Income/Expense Category & Account */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-text mb-1.5">Category</label>
                <select id="category_id" name="category_id" required className="input-base">
                  <option value="">Select category</option>
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="account_id" className="block text-sm font-medium text-text mb-1.5">Account</label>
                <select id="account_id" name="account_id" required className="input-base">
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (₱{Number(a.balance).toLocaleString()})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-text mb-1.5">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={today}
                className="input-base"
              />
            </div>
            
            {tab !== 'transfer' && (
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-text mb-1.5">Payment Method (Optional)</label>
                <select id="payment_method" name="payment_method" className="input-base">
                  <option value="">None</option>
                  <option value="cash">Cash</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="e_wallet">E-Wallet</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text mb-1.5">Note / Description (Optional)</label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="What was this for?"
              className="input-base"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Link
              href="/transactions"
              className="px-6 py-3 font-semibold text-text-secondary hover:bg-surface-raised rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-5 h-5" /> Save {tab}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
