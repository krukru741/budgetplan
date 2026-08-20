'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { upsertBudget } from '../actions'

export default function EditBudgetModal({
  isOpen,
  onClose,
  category,
  month,
  year
}: {
  isOpen: boolean
  onClose: () => void
  category: { id: string, name: string, budget_amount: number } | null
  month: number
  year: number
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>('')

  // Update local state when category changes
  // Using a key on the component in the parent is better, but we'll sync it here when it opens
  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return
    
    setLoading(true)
    setError(null)
    
    try {
      await upsertBudget(category.id, month, year, parseFloat(amount || '0'))
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Edit Budget</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-text-secondary hover:bg-surface-raised transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-1.5">
              Budget for {category?.name}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={category?.budget_amount.toString()}
                className="w-full bg-surface-raised border border-border rounded-xl py-3 pl-8 pr-4 text-text placeholder-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-display font-bold text-xl"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 font-semibold text-text-secondary hover:bg-surface-raised rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 px-4 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-5 h-5" /> Save</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
