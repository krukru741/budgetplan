'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import EditBudgetModal from './components/EditBudgetModal'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type CategoryBudget = {
  category_id: string
  name: string
  group_name: string | null
  icon: string | null
  budget_amount: number
  spent_amount: number
  rollover_in: number
  effective_budget: number
  remaining_amount: number
}

import Icon from '@/components/ui/Icon'

export default function BudgetClient({
  month,
  year,
  budgets,
  totals
}: {
  month: number
  year: number
  budgets: CategoryBudget[]
  totals: {
    income: number
    budgeted: number
    spent: number
    unallocated: number
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [editingCategory, setEditingCategory] = useState<CategoryBudget | null>(null)

  // Group budgets
  const needs = budgets.filter(b => b.group_name === 'needs')
  const wants = budgets.filter(b => b.group_name === 'wants')
  const financial = budgets.filter(b => b.group_name === 'financial')

  function changeMonth(offset: number) {
    let newMonth = month + offset
    let newYear = year
    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }
    const params = new URLSearchParams(searchParams)
    params.set('month', newMonth.toString())
    params.set('year', newYear.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  const renderGroup = (title: string, groupBudgets: CategoryBudget[]) => {
    if (groupBudgets.length === 0) return null
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupBudgets.map((b, index) => {
            const progress = b.effective_budget > 0 ? (b.spent_amount / b.effective_budget) * 100 : 0
            const isOver = b.spent_amount > b.effective_budget
            const isLastOdd = index === groupBudgets.length - 1 && groupBudgets.length % 2 !== 0
            
            return (
              <div key={b.category_id} className={`card p-3.5 hover:border-primary/30 hover:bg-primary-light/10 transition-colors group ${isLastOdd ? 'md:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
                      <Icon name={b.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{b.name}</h3>
                      <div className="text-xs text-text-secondary">
                        {b.budget_amount === 0 
                          ? 'Not budgeted' 
                          : b.rollover_in > 0 
                            ? `Budget: ₱${b.budget_amount} + ₱${b.rollover_in} rollover` 
                            : `Budget: ₱${b.budget_amount}`}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingCategory(b)}
                    className="p-2 text-primary/70 hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-stone-200/50 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-danger' : (b.effective_budget > 0 ? 'bg-primary' : 'bg-transparent')}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-text-secondary">
                    ₱{b.spent_amount.toLocaleString()} spent
                  </span>
                  <span className={isOver ? 'text-danger' : 'text-success'}>
                    {isOver ? '-' : ''}₱{Math.abs(b.remaining_amount).toLocaleString()} remaining
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <div className="page-container animate-fade-in w-full max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header & Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-primary">Budget</h1>
        <div className="flex items-center bg-primary-light rounded-xl p-1 shadow-sm border border-transparent">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-primary">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 font-semibold text-primary min-w-[140px] text-center">
            {monthName} {year}
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-primary">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 w-full gap-4 mb-8">
        <div className="card p-4">
          <div className="text-xs font-semibold text-primary/70 mb-1">Income</div>
          <div className="text-lg font-semibold text-text">₱{totals.income.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-primary/70 mb-1">Budgeted</div>
          <div className="text-lg font-semibold text-primary">₱{totals.budgeted.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-primary/70 mb-1">Spent</div>
          <div className="text-lg font-semibold text-danger">₱{totals.spent.toLocaleString()}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-primary/70 mb-1">Unallocated</div>
          <div className={`text-lg font-semibold ${totals.unallocated < 0 ? 'text-danger' : 'text-success'}`}>
            ₱{totals.unallocated.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Categories */}
      {renderGroup('Needs', needs)}
      {renderGroup('Wants', wants)}
      {renderGroup('Financial', financial)}

      {/* Edit Modal */}
      <EditBudgetModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory ? { id: editingCategory.category_id, name: editingCategory.name, budget_amount: editingCategory.budget_amount } : null}
        month={month}
        year={year}
      />
    </div>
  )
}
