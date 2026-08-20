'use client'

import { useState } from 'react'
import { Plus, Target, CheckCircle2, PiggyBank, TrendingUp } from 'lucide-react'
import Icon from '@/components/ui/Icon'
import AddGoalModal from './AddGoalModal'
import ContributeModal from './ContributeModal'

type Goal = {
  id: string
  name: string
  icon: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  status: string
  completed_at: string | null
}

type Account = { id: string; name: string; balance: number }

export default function GoalsClient({ 
  initialGoals,
  accounts
}: { 
  initialGoals: Goal[]
  accounts: Account[]
}) {
  const [filter, setFilter] = useState<'active' | 'completed'>('active')
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Contribute Modal State
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<{id: string, name: string} | null>(null)

  const filteredGoals = initialGoals.filter(g => g.status === filter)

  // Summary Metrics (calculated over active goals usually, or all goals depending on preference)
  // We'll calculate over active goals for "progress", but let's show overall for "total saved"
  const totalSaved = initialGoals.reduce((sum, g) => sum + Number(g.current_amount), 0)
  const totalTarget = initialGoals.reduce((sum, g) => sum + Number(g.target_amount), 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
  
  const activeSaved = initialGoals.filter(g => g.status === 'active').reduce((sum, g) => sum + Number(g.current_amount), 0)
  const activeTarget = initialGoals.filter(g => g.status === 'active').reduce((sum, g) => sum + Number(g.target_amount), 0)

  const handleContributeClick = (goal: Goal) => {
    setSelectedGoal({ id: goal.id, name: goal.name })
    setIsContributeModalOpen(true)
  }

  return (
    <div className="page-container animate-fade-in w-full max-w-7xl mx-auto pb-28 md:pb-8 flex flex-col gap-8">
      {/* Header */}
      <div className="section-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Goals & Savings</h1>
          <p className="text-text-secondary mt-1 hidden md:block">Track your progress towards financial goals</p>
        </div>
        {initialGoals.length > 0 && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary text-white p-2.5 md:px-4 md:py-2 rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">New Goal</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="card p-5 h-full flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-light rounded-lg text-primary">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-primary/70 uppercase tracking-wider">Total Saved</div>
          </div>
          <div className="text-2xl font-bold text-primary">₱{totalSaved.toLocaleString()}</div>
        </div>
        <div className="card p-5 h-full flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-light rounded-lg text-primary">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-primary/70 uppercase tracking-wider line-clamp-1">Total Target</div>
          </div>
          <div className="text-2xl font-bold text-primary">₱{totalTarget.toLocaleString()}</div>
        </div>
        <div className="card p-5 col-span-2 md:col-span-1 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-light rounded-lg text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-primary/70 uppercase tracking-wider">Overall Progress</div>
            </div>
            <div className="text-2xl font-bold text-primary">{overallProgress.toFixed(1)}%</div>
          </div>
          <div className="h-1.5 w-full bg-stone-200/50 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex bg-surface-raised p-1 rounded-xl w-full md:w-fit h-11">
        {['active', 'completed'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            className={`flex-1 md:px-8 py-1.5 text-sm rounded-lg capitalize transition-colors ${
              filter === t 
                ? 'bg-primary-light text-primary font-bold shadow-sm' 
                : 'text-text-secondary font-medium hover:text-text hover:bg-white/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="card border-dashed border-stone-200 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary-light/50 text-primary flex items-center justify-center mb-4">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-primary mb-1">No {filter} goals found</h3>
          <p className="text-text-secondary mb-6">Create a new savings goal to start tracking.</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            Create New Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map(goal => {
            const progress = (goal.current_amount / goal.target_amount) * 100
            const isCompleted = goal.status === 'completed' || progress >= 100
            
            return (
              <div key={goal.id} className="card p-5 hover:border-primary/30 hover:shadow-md transition-all group flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                      <Icon name={goal.icon || 'Target'} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary line-clamp-1">{goal.name}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {goal.target_date ? `Target: ${new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'No target date'}
                      </p>
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="p-1 rounded-full bg-success-light text-success">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end mb-2 mt-auto">
                  <div>
                    <div className="text-sm font-semibold text-primary/70 uppercase tracking-wider mb-1">Saved</div>
                    <div className="text-xl font-bold text-primary">₱{Number(goal.current_amount).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Target</div>
                    <div className="text-sm font-medium text-text-secondary">₱{Number(goal.target_amount).toLocaleString()}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-stone-200/50 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full rounded-full transition-all ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                {/* Contribute Button */}
                {!isCompleted && (
                  <button 
                    onClick={() => handleContributeClick(goal)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-primary/20 text-primary font-semibold hover:bg-primary hover:text-white hover:border-transparent transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Contribute
                  </button>
                )}
                
                {isCompleted && (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-success-light/50 text-success font-semibold text-center border border-success/20">
                    Goal Reached! 🎉
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <AddGoalModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      {selectedGoal && (
        <ContributeModal 
          isOpen={isContributeModalOpen} 
          onClose={() => setIsContributeModalOpen(false)}
          goalId={selectedGoal.id}
          goalName={selectedGoal.name}
          accounts={accounts}
        />
      )}
    </div>
  )
}
