'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './actions'
import { Check, ChevronRight, Landmark, Wallet, CreditCard, Banknote } from 'lucide-react'

const CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

const BUDGET_METHODS = [
  { id: '50/30/20', name: '50/30/20 Rule', desc: 'Needs (50%), Wants (30%), Savings (20%)' },
  { id: 'zero-based', name: 'Zero-Based', desc: 'Give every dollar a job. Income minus expenses equals zero.' },
  { id: 'custom', name: 'Custom', desc: 'Set your own rules and allocate freely.' },
]

const ACCOUNT_TYPES = [
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'bank', name: 'Bank Account', icon: Landmark },
  { id: 'e-wallet', name: 'E-Wallet', icon: Wallet },
  { id: 'credit_card', name: 'Credit Card', icon: CreditCard },
]

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [currency, setCurrency] = useState('PHP')
  const [budgetMethod, setBudgetMethod] = useState('50/30/20')
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState('bank')
  const [startingBalance, setStartingBalance] = useState('')

  async function handleFinish() {
    if (!accountName || !startingBalance) {
      setError('Please fill in all account details.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await completeOnboarding({
        currency,
        budgetMethod,
        accountName,
        accountType,
        startingBalance: parseFloat(startingBalance) || 0
      })
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${step >= i ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        <div className="card card-lg animate-slide-up">
          {error && (
            <div className="mb-6 p-4 bg-danger-light text-danger rounded-xl text-sm border border-danger/20">
              {error}
            </div>
          )}

          {/* STEP 1: Currency */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-display font-bold text-text mb-2">Welcome to BudgetPlan</h1>
                <p className="text-text-secondary">Let&apos;s start by setting your primary currency.</p>
              </div>

              <div className="space-y-3">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      currency === c.code ? 'border-primary bg-primary-light/30' : 'border-border bg-surface hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-lg ${
                        currency === c.code ? 'bg-primary text-white' : 'bg-surface-raised text-text'
                      }`}>
                        {c.symbol}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-text">{c.code}</div>
                        <div className="text-sm text-text-secondary">{c.name}</div>
                      </div>
                    </div>
                    {currency === c.code && <Check className="text-primary w-5 h-5" />}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3.5 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all mt-8"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2: Budget Method */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-display font-bold text-text mb-2">How do you budget?</h1>
                <p className="text-text-secondary">Choose a methodology. You can always change this later in Settings.</p>
              </div>

              <div className="space-y-3">
                {BUDGET_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setBudgetMethod(m.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      budgetMethod === m.id ? 'border-primary bg-primary-light/30' : 'border-border bg-surface hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-text mb-1">{m.name}</div>
                      <div className="text-sm text-text-secondary pr-6">{m.desc}</div>
                    </div>
                    {budgetMethod === m.id && <Check className="text-primary w-5 h-5 flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3.5 font-semibold text-text-secondary hover:bg-surface-raised rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3.5 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Account */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-display font-bold text-text mb-2">Add your first account</h1>
                <p className="text-text-secondary">Where is your money right now? This sets your starting balance.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCOUNT_TYPES.map(type => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.id}
                          onClick={() => setAccountType(type.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 gap-2 transition-all ${
                            accountType === type.id ? 'border-primary bg-primary-light/30 text-primary' : 'border-border bg-surface text-text-secondary hover:border-primary/50'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{type.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder={accountType === 'bank' ? 'e.g. BPI Payroll' : accountType === 'e-wallet' ? 'e.g. GCash' : 'e.g. Physical Wallet'}
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Starting Balance ({currency})</label>
                  <input
                    type="number"
                    value={startingBalance}
                    onChange={e => setStartingBalance(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="input-base text-lg font-medium tabular-nums"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-6 py-3.5 font-semibold text-text-secondary hover:bg-surface-raised rounded-xl transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading || !accountName || !startingBalance}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3.5 px-6 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-5 h-5" /> Complete Setup</>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
