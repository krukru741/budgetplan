'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, CalendarDays, Repeat } from 'lucide-react'
import { addBill } from '../actions'
import { createClient } from '@/lib/supabase/client'

export default function AddBillPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [categories, setCategories] = useState<any[]>([])
  
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [frequency, setFrequency] = useState('monthly')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .is('archived_at', null)
        .order('name')
      
      if (cats) setCategories(cats)
    }
    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !amount || !dueDate) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await addBill({
        name,
        original_amount: parseFloat(amount),
        due_date: dueDate,
        category_id: categoryId || undefined,
        recurring,
        frequency: recurring ? frequency : undefined
      })
      router.push('/bills')
    } catch (err: any) {
      setError(err.message || 'Failed to add bill')
      setLoading(false)
    }
  }

  return (
    <div className="page-container animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/bills"
          className="p-2 -ml-2 rounded-xl text-text-secondary hover:bg-surface-raised transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Add Bill</h1>
          <p className="text-text-secondary mt-1">Track a new recurring expense or one-off bill</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20">
            {error}
          </div>
        )}

        <div className="card p-6 space-y-6">
          {/* Bill Name */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Bill Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Electricity, Internet, Netflix"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Amount & Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Amount <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-surface border border-border rounded-xl py-3 pl-8 pr-4 text-text placeholder-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-display font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Due Date <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-3 pl-11 pr-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
            >
              <option value="">Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Recurring Toggle */}
          <div className="pt-4 border-t border-border">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-text-secondary" />
                <span className="font-medium text-text">This is a recurring bill</span>
              </div>
            </label>
          </div>

          {recurring && (
            <div className="animate-fade-in pl-8">
              <label className="block text-sm font-medium text-text mb-1.5">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly (Every 2 weeks)</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <p className="text-xs text-text-tertiary mt-2">
                When you pay this bill, the next occurrence will be automatically generated.
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-4 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Check className="w-5 h-5" /> Save Bill</>
          )}
        </button>
      </form>
    </div>
  )
}
