'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { addContribution } from './actions'

type Account = { id: string; name: string; balance: number }

export default function ContributeModal({
  isOpen,
  onClose,
  goalId,
  goalName,
  accounts
}: {
  isOpen: boolean
  onClose: () => void
  goalId: string
  goalName: string
  accounts: Account[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const today = new Date().toISOString().split('T')[0]
  
  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('goal_id', goalId)
      await addContribution(formData)
      setLoading(false)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add contribution')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-display font-bold text-primary">Contribute to Savings</h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-full text-text-tertiary hover:bg-primary-light/50 hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {error && (
            <div className="p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20 mb-6">
              {error}
            </div>
          )}
          
          <div className="mb-6 p-4 bg-primary-light/30 rounded-xl border border-primary-light">
            <p className="text-sm text-primary/80 font-medium text-center">
              You are adding funds to <span className="font-bold">{goalName}</span>
            </p>
          </div>

          <form id="add-contribution-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Amount (₱)</label>
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

            {/* Source Account */}
            <div>
              <label htmlFor="account_id" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Source Account</label>
              <select id="account_id" name="account_id" required className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary">
                <option value="">Select account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} (₱{Number(a.balance).toLocaleString()})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
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
              
              {/* Note */}
              <div>
                <label htmlFor="note" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Note (Optional)</label>
                <input
                  id="note"
                  name="note"
                  type="text"
                  placeholder="e.g. From bonus"
                  className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
                />
              </div>
            </div>
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
            form="add-contribution-form"
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Check className="w-5 h-5" /> Contribute</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
