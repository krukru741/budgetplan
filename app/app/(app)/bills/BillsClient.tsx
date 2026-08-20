'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, CreditCard, CalendarDays, Receipt, Check } from 'lucide-react'
import Icon from '@/components/ui/Icon'
import PayBillModal from './components/PayBillModal'
import { deleteBill } from './actions'

export default function BillsClient({
  overdueBills,
  upcomingBills,
  paidBills
}: {
  overdueBills: any[]
  upcomingBills: any[]
  paidBills: any[]
}) {
  const [payingBill, setPayingBill] = useState<any | null>(null)
  
  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this bill? This will not delete its past transactions.')) {
      await deleteBill(id)
    }
  }

  const renderBillCard = (bill: any, isPaid: boolean = false) => {
    const remaining = Number(bill.original_amount) - Number(bill.paid_amount)
    const isOverdue = bill.status === 'OVERDUE'
    
    return (
      <div key={bill.id} className={`card p-4 flex flex-col gap-4 transition-colors ${isPaid ? 'opacity-60 bg-surface-raised' : 'hover:border-primary/30'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              isPaid ? 'bg-success-light/50 text-success' : isOverdue ? 'bg-danger-light text-danger' : 'bg-primary-light text-primary'
            }`}>
              {bill.category?.icon ? <Icon name={bill.category.icon} className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-primary leading-tight">{bill.name}</h3>
              <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {isOverdue ? <span className="text-danger font-medium">Overdue {new Date(bill.due_date).toLocaleDateString()}</span> : `Due ${new Date(bill.due_date).toLocaleDateString()}`}
                {bill.recurring && <span className="ml-1 px-1.5 py-0.5 bg-surface border border-border rounded text-[10px] uppercase tracking-wider">{bill.frequency}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPaid && (
              <button 
                onClick={() => setPayingBill(bill)}
                className="text-xs font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
              >
                Pay
              </button>
            )}
            <button 
              onClick={() => handleDelete(bill.id)}
              className="p-1.5 text-text-tertiary hover:text-danger hover:bg-danger-light/50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-end">
          <div>
            <div className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1">Total Bill</div>
            <div className="font-semibold text-primary">₱{Number(bill.original_amount).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Remaining</div>
            <div className={`font-bold tabular-nums text-lg ${isPaid ? 'text-success' : isOverdue ? 'text-danger' : 'text-primary'}`}>
              ₱{remaining.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasNoBills = overdueBills.length === 0 && upcomingBills.length === 0 && paidBills.length === 0

  return (
    <div className="page-container animate-fade-in w-full max-w-7xl mx-auto pb-28 md:pb-8 flex flex-col gap-8">
      <div className="section-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Bills & Subscriptions</h1>
          <p className="text-text-secondary mt-1 hidden md:block">Manage your recurring payments and obligations</p>
        </div>
        <Link 
          href="/bills/add"
          className="flex items-center justify-center gap-2 bg-primary text-white p-2.5 md:px-4 md:py-2 rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Add Bill</span>
        </Link>
      </div>

      <div className="mt-8 space-y-8">
        {hasNoBills ? (
          <div className="card border-dashed p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-surface-raised text-text-tertiary flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-text mb-1">No bills yet</h3>
            <p className="text-text-secondary mb-6">Track your monthly obligations and never miss a payment.</p>
            <Link 
              href="/bills/add"
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm"
            >
              Add your first bill
            </Link>
          </div>
        ) : (
          <>
            {overdueBills.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-danger flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-danger"></span>
                  Overdue
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {overdueBills.map(b => renderBillCard(b))}
                </div>
              </section>
            )}

            {upcomingBills.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-text mb-4">Upcoming</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingBills.map(b => renderBillCard(b))}
                </div>
              </section>
            )}

            {paidBills.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-text-tertiary mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Paid this period
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {paidBills.map(b => renderBillCard(b, true))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <PayBillModal
        isOpen={!!payingBill}
        onClose={() => setPayingBill(null)}
        bill={payingBill}
      />
    </div>
  )
}
