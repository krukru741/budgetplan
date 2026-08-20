'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { addDebt } from '../actions'

export default function AddDebtModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      await addDebt(formData)
      setLoading(false)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add debt')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <h2 className="text-xl font-display font-bold text-primary">New Debt</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-primary/60 hover:text-primary hover:bg-primary-light/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Debt Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. BPI Credit Card, Home Loan"
                className="w-full bg-surface-raised border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-primary font-medium placeholder:text-primary/30 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="original_amount" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Original Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">₱</span>
                <input
                  type="number"
                  id="original_amount"
                  name="original_amount"
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-full bg-[#FFFBE8] border-2 border-transparent focus:border-primary/20 rounded-xl pl-10 pr-4 py-3 text-primary font-bold outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="minimum_payment" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Min. Payment</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50 font-bold">₱</span>
                  <input
                    type="number"
                    id="minimum_payment"
                    name="minimum_payment"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    className="w-full bg-surface-raised border-2 border-transparent focus:border-primary/20 rounded-xl pl-8 pr-3 py-3 text-primary font-medium placeholder:text-primary/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="interest_rate" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Interest Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    id="interest_rate"
                    name="interest_rate"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    className="w-full bg-surface-raised border-2 border-transparent focus:border-primary/20 rounded-xl pl-3 pr-8 py-3 text-primary font-medium placeholder:text-primary/30 outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/50 font-bold">%</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                className="w-full bg-surface-raised border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 text-primary font-medium outline-none transition-all [color-scheme:light]"
              />
            </div>
          </div>

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
                  Save Debt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
