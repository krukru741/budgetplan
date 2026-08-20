'use client'

import { useState, useEffect } from 'react'
import { Check, X, Landmark } from 'lucide-react'
import { payBill } from '../actions'
import { createClient } from '@/lib/supabase/client'

export default function PayBillModal({
  isOpen,
  onClose,
  bill
}: {
  isOpen: boolean
  onClose: () => void
  bill: any | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function loadAccounts() {
      const supabase = createClient()
      const { data } = await supabase
        .from('accounts')
        .select('id, name, balance')
        .is('archived_at', null)
        .order('name')
      
      if (data) {
        setAccounts(data)
        if (data.length > 0) setAccountId(data[0].id)
      }
    }
    if (isOpen) {
      loadAccounts()
      // Auto-fill amount with remaining balance
      if (bill) {
        const remaining = Number(bill.original_amount) - Number(bill.paid_amount)
        setAmount(remaining.toString())
      }
    }
  }, [isOpen, bill])

  if (!isOpen || !bill) return null

  const remaining = Number(bill.original_amount) - Number(bill.paid_amount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId || !amount || !date) return
    
    setLoading(true)
    setError(null)
    
    try {
      await payBill(bill.id, accountId, parseFloat(amount), date)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to pay bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Pay Bill: {bill.name}</h2>
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

          <div className="mb-4 bg-surface-raised p-4 rounded-xl border border-border">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Original Amount</span>
              <span className="font-medium">₱{Number(bill.original_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Already Paid</span>
              <span className="font-medium text-success">₱{Number(bill.paid_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border/50 pt-2">
              <span>Remaining Balance</span>
              <span className="text-danger">₱{remaining.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Pay from Account
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  <Landmark className="w-5 h-5" />
                </span>
                <select
                  required
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-3 pl-11 pr-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  <option value="" disabled>Select an account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} (₱{Number(a.balance).toLocaleString()})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl py-3 pl-8 pr-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-display font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-3 px-4 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
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
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <><Check className="w-5 h-5" /> Confirm Payment</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
