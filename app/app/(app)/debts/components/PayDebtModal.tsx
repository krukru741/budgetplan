'use client'

import { useState } from 'react'
import { X, Check, Wallet } from 'lucide-react'
import { payDebt } from '../actions'

type Account = { id: string; name: string; balance: number }
type Debt = { id: string; name: string; remaining_amount: number; minimum_payment: number | null }

export default function PayDebtModal({
  isOpen,
  onClose,
  debt,
  accounts
}: {
  isOpen: boolean
  onClose: () => void
  debt: Debt | null
  accounts: Account[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !debt) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      const amount = parseFloat(formData.get('amount') as string)
      const accountId = formData.get('account_id') as string
      const date = formData.get('date') as string
      const note = formData.get('note') as string

      // Validation 1: Amount vs Remaining Debt
      if (amount > debt!.remaining_amount) {
        throw new Error(`Payment cannot exceed remaining debt of ₱${debt!.remaining_amount.toLocaleString()}`)
      }

      // Validation 2: Overdraft Protection
      const account = accounts.find(a => a.id === accountId)
      if (account && amount > account.balance) {
        throw new Error(`Insufficient funds in source account (Balance: ₱${account.balance.toLocaleString()})`)
      }

      await payDebt(debt!.id, accountId, amount, date, note)
      
      setLoading(false)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to process payment')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-display font-bold text-primary">Pay Debt</h2>
            <p className="text-sm text-primary/60 font-medium mt-0.5">{debt.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-primary/60 hover:text-primary hover:bg-primary-light/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
            
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium">
                {error}
              </div>
            )}

            {/* Remaining Amount Context */}
            <div className="bg-primary-light/20 p-4 rounded-xl border border-primary/10 flex items-center justify-between">
              <span className="text-sm font-medium text-primary/70">Remaining Debt</span>
              <span className="font-bold text-primary">₱{debt.remaining_amount.toLocaleString()}</span>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="amount" className="block text-xs font-semibold text-primary/80 uppercase tracking-wider">Payment Amount</label>
                {debt.minimum_payment && (
                  <span className="text-[10px] font-bold bg-primary-light text-primary px-2 py-0.5 rounded-full">
                    Min: ₱{debt.minimum_payment.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-2xl">₱</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  step="0.01"
                  min="0.01"
                  max={debt.remaining_amount}
                  defaultValue={debt.minimum_payment || ''}
                  placeholder="0.00"
                  className="w-full bg-[#FFFBE8] border-2 border-transparent focus:border-primary/20 rounded-xl pl-12 pr-4 py-4 text-3xl text-primary font-bold placeholder:text-primary/30 outline-none transition-all"
                />
              </div>
            </div>

            {/* Source Account */}
            <div>
              <label htmlFor="account_id" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Pay From</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="w-5 h-5 text-primary/40" />
                </div>
                <select
                  id="account_id"
                  name="account_id"
                  required
                  className="w-full bg-surface-raised border-2 border-transparent focus:border-primary/20 rounded-xl pl-10 pr-4 py-3 text-primary font-medium outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select an account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} (₱{account.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Payment Date</label>
              <input
                type="date"
                id="date"
                name="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full bg-surface-raised border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-primary font-medium outline-none transition-all [color-scheme:light]"
              />
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Note (Optional)</label>
              <input
                type="text"
                id="note"
                name="note"
                placeholder="e.g. Monthly payment"
                className="w-full bg-surface-raised border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-primary font-medium placeholder:text-primary/30 outline-none transition-all"
              />
            </div>

          </div>

          {/* Footer Action */}
          <div className="p-4 sm:p-6 border-t border-border bg-surface sticky bottom-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm Payment
                </>
              )}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  )
}
