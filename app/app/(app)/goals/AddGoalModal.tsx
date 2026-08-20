'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { addGoal } from './actions'
import Icon from '@/components/ui/Icon'

export default function AddGoalModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Quick pre-selected icons for goals
  const goalIcons = ['Target', 'Car', 'Home', 'Plane', 'Laptop', 'GraduationCap', 'Heart', 'Shield']
  const [selectedIcon, setSelectedIcon] = useState('Target')
  
  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('icon', selectedIcon)
      await addGoal(formData)
      setLoading(false)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create goal')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-display font-bold text-primary">New Savings Goal</h2>
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

          <form id="add-goal-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Goal Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Goal Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Emergency Fund"
                className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
              />
            </div>

            {/* Target Amount */}
            <div>
              <label htmlFor="target_amount" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Target Amount (₱)</label>
              <input
                id="target_amount"
                name="target_amount"
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="10,000"
                className="w-full bg-[#FFFBE8] border border-transparent rounded-xl py-4 px-4 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light transition-all text-xl font-bold tabular-nums text-primary placeholder-primary/60"
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-xs font-semibold text-primary/80 mb-2 uppercase tracking-wider">Choose an Icon</label>
              <div className="flex flex-wrap gap-2">
                {goalIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      selectedIcon === icon 
                        ? 'bg-primary text-white shadow-sm scale-110' 
                        : 'bg-surface-raised text-primary/60 hover:bg-primary-light/50 hover:text-primary'
                    }`}
                  >
                    <Icon name={icon} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Target Date */}
            <div>
              <label htmlFor="target_date" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Target Date (Optional)</label>
              <input
                id="target_date"
                name="target_date"
                type="date"
                className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
              />
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
            form="add-goal-form"
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Check className="w-5 h-5" /> Create Goal</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
