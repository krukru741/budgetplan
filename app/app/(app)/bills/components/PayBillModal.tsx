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
    
    const parsedAmount = parseFloat(amount)
    if (parsedAmount > remaining) {
      setError(`Payment cannot exceed the remaining balance of ₱${remaining.toLocaleString()}`)
      return
    }
    if (parsedAmount <= 0) {
      setError('Payment amount must be greater than 0')
      return
    }
    
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
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-surface sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-display font-bold text-primary">Pay Bill: {bill.name}</h2>
          <button onClick={onClose} className="p-1.5 -mr-1.5 rounded-full text-text-tertiary hover:bg-primary-light/50 hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20">
              {error}
            </div>
          )}          <div className="mb-6 bg-primary-light/30 p-4 rounded-xl border border-primary-light">
            <div className="flex justify-between text-sm mb-1 text-primary/80">
              <span>Original Amount</span>
              <span className="font-semibold text-primary">₱{Number(bill.original_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2 text-primary/80">
              <span>Already Paid</span>
              <span className="font-semibold text-success">₱{Number(bill.paid_amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-primary/20 pt-2 text-primary">
              <span>Remaining Balance</span>
              <span className="text-danger">₱{remaining.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Amount (₱)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-2xl">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining}
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[#FFFBE8] border border-transparent rounded-xl py-4 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light transition-all text-3xl font-display font-bold tabular-nums text-primary placeholder-primary/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Pay From</label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (₱{Number(a.balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-semibold text-primary/70 hover:text-primary hover:bg-primary-light/50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <><Check className="w-5 h-5" /> Record Payment</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
