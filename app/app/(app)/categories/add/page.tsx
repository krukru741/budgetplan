'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { addCategory } from '../actions'

const GROUPS = [
  { id: 'needs', name: 'Needs', desc: 'Essential expenses (e.g., Rent, Groceries)' },
  { id: 'wants', name: 'Wants', desc: 'Discretionary spending (e.g., Dining, Hobbies)' },
  { id: 'financial', name: 'Financial', desc: 'Savings, Investments, Debt Payments' },
]

export default function AddCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [type, setType] = useState('expense')
  const [group, setGroup] = useState('needs')
  const [icon, setIcon] = useState('🏷️')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('type', type)
      if (type === 'expense') formData.set('group', group)
      formData.set('icon', icon)
      
      await addCategory(formData)
      router.push('/categories')
    } catch (err: any) {
      setError(err.message || 'Failed to add category')
      setLoading(false)
    }
  }

  return (
    <div className="page-container animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/categories" className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-raised transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-display font-bold text-text">Add Category</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div className="p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20">
            {error}
          </div>
        )}

        {/* Type Toggle */}
        <div className="flex bg-surface-raised p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'expense' ? 'bg-surface text-text shadow-sm' : 'text-text-secondary hover:text-text'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'income' ? 'bg-surface text-text shadow-sm' : 'text-text-secondary hover:text-text'}`}
          >
            Income
          </button>
        </div>

        {/* Name & Icon */}
        <div className="flex gap-4">
          <div className="w-20">
            <label className="block text-sm font-medium text-text mb-1.5">Emoji</label>
            <input
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="input-base text-center text-xl"
              maxLength={2}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">Category Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g. Coffee' : 'e.g. Freelance'}
              className="input-base"
            />
          </div>
        </div>

        {/* Group (Only for Expenses) */}
        {type === 'expense' && (
          <div>
            <label className="block text-sm font-medium text-text mb-3">Budget Group (50/30/20 Rule)</label>
            <div className="space-y-3">
              {GROUPS.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroup(g.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    group === g.id ? 'border-primary bg-primary-light/30' : 'border-border bg-surface hover:border-primary/50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-text mb-1">{g.name}</div>
                    <div className="text-sm text-text-secondary">{g.desc}</div>
                  </div>
                  {group === g.id && <Check className="text-primary w-5 h-5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <Link
            href="/categories"
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
              <><Check className="w-5 h-5" /> Add Category</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
