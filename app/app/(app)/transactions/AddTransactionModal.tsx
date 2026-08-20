'use client'

import { useState } from 'react'
import { X, Check, ArrowRightLeft } from 'lucide-react'
import { addTransaction, addTransfer } from './actions'

type Account = { id: string; name: string; type: string; balance: number }
type Category = { id: string; name: string; type: string; icon: string | null; group_name: string | null }

export default function AddTransactionModal({
  isOpen,
  onClose,
  accounts,
  categories
}: {
  isOpen: boolean
  onClose: () => void
  accounts: Account[]
  categories: Category[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [tab, setTab] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [isRecurring, setIsRecurring] = useState(false)
  
  if (!isOpen) return null

  const activeCategories = categories.filter(c => c.type === tab)
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      if (tab === 'transfer') {
        const fromAccount = formData.get('from_account_id') as string
        const toAccount = formData.get('to_account_id') as string
        const amount = parseFloat(formData.get('amount') as string)

        if (fromAccount === toAccount) {
          setError('Source and Destination accounts cannot be the same.')
          setLoading(false)
          return
        }

        const sourceAccount = accounts.find(a => a.id === fromAccount)
        if (sourceAccount && amount > sourceAccount.balance) {
          setError(`Insufficient funds in source account (Balance: ₱${sourceAccount.balance.toLocaleString()})`)
          setLoading(false)
          return
        }

        await addTransfer(formData)
      } else {
        formData.set('type', tab)
        await addTransaction(formData)
      }
      
      // Close the modal on success
      setLoading(false)
      onClose()
      // Optional: you can trigger a router.refresh() in parent if needed, but the server action usually handles revalidation.
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-surface w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-display font-bold text-primary">New Transaction</h2>
          <button 
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-full text-text-tertiary hover:bg-primary-light/50 hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex bg-surface-raised p-1 rounded-xl mb-6">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(null); setIsRecurring(false); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${
                  tab === t 
                    ? 'bg-primary-light text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20 mb-6">
              {error}
            </div>
          )}

          <form id="add-tx-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-2xl">₱</span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className="w-full bg-[#FFFBE8] border border-transparent rounded-xl py-4 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light transition-all text-3xl font-display font-bold tabular-nums text-primary placeholder-primary/60"
                />
              </div>
            </div>

            {/* Transfer Accounts */}
            {tab === 'transfer' ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label htmlFor="from_account_id" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">From Account</label>
                  <select id="from_account_id" name="from_account_id" required className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary">
                    <option value="">Select source account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (₱{Number(a.balance).toLocaleString()})</option>)}
                  </select>
                </div>
                <div className="pt-6 text-primary/50 px-1"><ArrowRightLeft className="w-5 h-5" /></div>
                <div className="flex-1">
                  <label htmlFor="to_account_id" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">To Account</label>
                  <select id="to_account_id" name="to_account_id" required className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary">
                    <option value="">Select destination account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (₱{Number(a.balance).toLocaleString()})</option>)}
                  </select>
                </div>
              </div>
            ) : (
              /* Income/Expense Category & Account */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category_id" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Category</label>
                  <select id="category_id" name="category_id" required className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary">
                    <option value="">Select category</option>
                    {activeCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="account_id" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Account</label>
                  <select id="account_id" name="account_id" required className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary">
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
                <label htmlFor="date" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
                />
              </div>
              
              {tab !== 'transfer' && (
                <div>
                  <label htmlFor="payment_method" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Payment Method (Optional)</label>
                  <select id="payment_method" name="payment_method" className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary">
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
              <label htmlFor="description" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Note / Description (Optional)</label>
              <input
                id="description"
                name="description"
                type="text"
                placeholder="What was this for?"
                className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
              />
            </div>

            {/* Recurring Toggle (Only for Income & Expense) */}
            {tab !== 'transfer' && (
              <div className="bg-primary-light/10 border border-primary/20 rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded border-primary/30 text-primary focus:ring-primary-light"
                  />
                  <span className="text-sm font-bold text-primary">Make this a recurring transaction</span>
                </label>
                
                {isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-primary/10">
                    <div>
                      <label htmlFor="frequency" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Frequency</label>
                      <select id="frequency" name="frequency" required className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary bg-white">
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="end_date" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">End Date (Optional)</label>
                      <input
                        id="end_date"
                        name="end_date"
                        type="date"
                        min={today}
                        className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary bg-white [color-scheme:light]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-stone-200/60 bg-surface shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 font-semibold text-primary/70 hover:text-primary hover:bg-primary-light/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            form="add-tx-form"
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Check className="w-5 h-5" /> Save {tab}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
