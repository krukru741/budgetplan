'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Landmark, Wallet, Banknote, CreditCard, Check } from 'lucide-react'
import { addAccount } from '../actions'

const ACCOUNT_TYPES = [
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'bank', name: 'Bank Account', icon: Landmark },
  { id: 'e-wallet', name: 'E-Wallet', icon: Wallet },
  { id: 'credit_card', name: 'Credit Card', icon: CreditCard },
]

export default function AddAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [type, setType] = useState('bank')
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.set('type', type) // inject the state-based type
      await addAccount(formData)
      // Note: addAccount redirects on success, so we don't need router.push here
    } catch (err: any) {
      setError(err.message || 'Failed to add account')
      setLoading(false)
    }
  }

  return (
    <div className="page-container animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/accounts" className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-raised transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-display font-bold text-text">Add Account</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {error && (
          <div className="p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text mb-3">Account Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACCOUNT_TYPES.map(accType => {
              const Icon = accType.icon
              return (
                <button
                  key={accType.id}
                  type="button"
                  onClick={() => setType(accType.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 gap-2 transition-all ${
                    type === accType.id 
                      ? 'border-primary bg-primary-light/30 text-primary' 
                      : 'border-border bg-surface text-text-secondary hover:border-primary/50'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{accType.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">Account Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={type === 'bank' ? 'e.g. BPI Payroll' : type === 'e-wallet' ? 'e.g. GCash' : 'e.g. Physical Wallet'}
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="balance" className="block text-sm font-medium text-text mb-1.5">Current Balance (₱)</label>
          <input
            id="balance"
            name="balance"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            className="input-base text-lg tabular-nums"
          />
          <p className="text-xs text-text-tertiary mt-2">
            This will be your starting balance. If this is a credit card, enter a negative number for your current balance.
          </p>
        </div>

        <div className="pt-4 flex gap-3">
          <Link
            href="/accounts"
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
              <><Check className="w-5 h-5" /> Add Account</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
