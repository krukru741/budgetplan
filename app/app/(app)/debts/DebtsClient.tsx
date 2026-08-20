'use client'

import { useState } from 'react'
import { Plus, CreditCard, CheckCircle2, MoreVertical, Trash2 } from 'lucide-react'
import AddDebtModal from './components/AddDebtModal'
import PayDebtModal from './components/PayDebtModal'
import { deleteDebt } from './actions'

type Account = { id: string; name: string; balance: number }
type DebtPayment = { id: string; amount: number; date: string; note: string | null; account: { name: string } }
type Debt = {
  id: string
  name: string
  original_amount: number
  remaining_amount: number
  minimum_payment: number | null
  due_date: string | null
  interest_rate: number | null
  status: string
  payments: DebtPayment[]
}

export default function DebtsClient({ debts, accounts }: { debts: Debt[], accounts: Account[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [payDebtId, setPayDebtId] = useState<string | null>(null)
  
  const activeDebts = debts.filter(d => d.status === 'active')
  const paidDebts = debts.filter(d => d.status === 'paid_off')

  const totalOutstanding = activeDebts.reduce((sum, d) => sum + Number(d.remaining_amount), 0)
  const totalMinPayments = activeDebts.reduce((sum, d) => sum + Number(d.minimum_payment || 0), 0)

  const debtToPay = payDebtId ? debts.find(d => d.id === payDebtId) || null : null

  return (
    <div className="page-container animate-fade-in w-full max-w-5xl mx-auto pb-28 md:pb-8 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Debt Management</h1>
          <p className="text-text-secondary mt-1">Track your loans and credit card payments</p>
        </div>
        {activeDebts.length > 0 && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="hidden sm:flex bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold items-center gap-2 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Add Debt
          </button>
        )}
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 border-l-4 border-l-danger">
          <div className="flex items-center gap-2 text-primary/70 text-xs font-semibold uppercase tracking-wider">
            Total Outstanding
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-primary tabular-nums">
            ₱{totalOutstanding.toLocaleString()}
          </div>
        </div>
        <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 border-l-4 border-l-primary-light">
          <div className="flex items-center gap-2 text-primary/70 text-xs font-semibold uppercase tracking-wider">
            Min. Payments Due
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-primary tabular-nums">
            ₱{totalMinPayments.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {debts.length === 0 ? (
        <div className="border-2 border-dashed border-stone-200/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center mt-4">
          <div className="w-16 h-16 bg-primary-light/30 rounded-2xl flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-primary/60" />
          </div>
          <h3 className="text-lg font-bold text-primary mb-2">No Debts Tracked</h3>
          <p className="text-primary/60 max-w-sm mb-6">
            You don't have any active debts or loans. Add one to start tracking your payments.
          </p>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Add New Debt
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* Active Debts */}
          {activeDebts.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-primary font-display flex items-center gap-2">
                Active Debts
                <span className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded-full">{activeDebts.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeDebts.map(debt => {
                  const paid = Number(debt.original_amount) - Number(debt.remaining_amount)
                  const percent = Math.min((paid / Number(debt.original_amount)) * 100, 100)

                  return (
                    <div key={debt.id} className="card p-5 flex flex-col gap-5 border border-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-primary text-lg">{debt.name}</h3>
                          {debt.due_date && (
                            <p className="text-sm text-primary/60 mt-0.5 flex items-center gap-1">
                              Due: {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this debt and its history?')) {
                              deleteDebt(debt.id)
                            }
                          }}
                          className="p-1.5 text-primary/40 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete Debt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Financials Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-raised p-3 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-primary/50 tracking-wider mb-1">Remaining</p>
                          <p className="font-bold text-primary text-lg">₱{Number(debt.remaining_amount).toLocaleString()}</p>
                        </div>
                        <div className="bg-surface-raised p-3 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-primary/50 tracking-wider mb-1">Min Payment</p>
                          <p className="font-bold text-primary text-lg">
                            {debt.minimum_payment ? `₱${Number(debt.minimum_payment).toLocaleString()}` : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-primary/60">Paid: ₱{paid.toLocaleString()}</span>
                          <span className="text-primary/60">Total: ₱{Number(debt.original_amount).toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <button 
                        onClick={() => setPayDebtId(debt.id)}
                        className="mt-2 w-full bg-primary-light/50 hover:bg-primary-light text-primary font-bold py-2.5 rounded-xl transition-colors"
                      >
                        Make a Payment
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Paid Off Debts */}
          {paidDebts.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-primary font-display flex items-center gap-2 opacity-70">
                Paid Off
                <span className="bg-stone-200 text-primary text-xs px-2 py-0.5 rounded-full">{paidDebts.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                {paidDebts.map(debt => (
                  <div key={debt.id} className="card p-4 flex items-center justify-between border-2 border-transparent hover:border-success/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary line-through decoration-primary/30">{debt.name}</h3>
                        <p className="text-xs text-primary/60">Fully paid</p>
                      </div>
                    </div>
                    <div className="font-bold text-primary">
                      ₱{Number(debt.original_amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Mobile Add FAB */}
      {debts.length > 0 && (
        <button 
          onClick={() => setIsAddOpen(true)}
          className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all z-40"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      <AddDebtModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />

      <PayDebtModal 
        isOpen={!!payDebtId} 
        onClose={() => setPayDebtId(null)} 
        debt={debtToPay}
        accounts={accounts}
      />

    </div>
  )
}
