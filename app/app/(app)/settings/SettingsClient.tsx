'use client'

import { useState, useTransition } from 'react'
import { Check, LogOut, Settings2, User, Globe, AlertTriangle } from 'lucide-react'
import { updateProfile, updatePreferences } from './actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsClient({
  profile,
  preferences
}: {
  profile: any
  preferences: any
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPendingProfile, startTransitionProfile] = useTransition()
  const [isPendingPrefs, startTransitionPrefs] = useTransition()
  
  // Local state for optimistic updates
  const [rollover, setRollover] = useState(preferences?.budget_rollover || false)
  const [theme, setTheme] = useState(preferences?.theme || 'system')
  const [defaultMethod, setDefaultMethod] = useState(preferences?.default_budget_method || 'custom')

  // Modals
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransitionProfile(async () => {
      try {
        await updateProfile(formData)
        setSuccessMessage('Profile updated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const handlePrefsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // Update local state right away
    setTheme(formData.get('theme') as string)
    setDefaultMethod(formData.get('default_budget_method') as string)
    setRollover(formData.get('budget_rollover') === 'true')
    
    startTransitionPrefs(async () => {
      try {
        await updatePreferences(formData)
        setSuccessMessage('Preferences saved!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="page-container animate-fade-in w-full max-w-5xl mx-auto pb-28 md:pb-8 flex flex-col gap-8">
      {/* Header */}
      <div className="section-header">
        <h1 className="text-2xl font-display font-bold text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {successMessage && (
        <div className="bg-success-light text-success p-4 rounded-xl font-semibold border border-success/20 animate-fade-in">
          {successMessage}
        </div>
      )}

      {/* Grid Layout: 1 col on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Profile & Account */}
        <div className="space-y-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-primary">Regional Settings</h2>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label htmlFor="currency" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Currency</label>
                <select 
                  id="currency" 
                  name="currency" 
                  defaultValue={profile?.currency || 'PHP'} 
                  className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
                >
                  <option value="PHP">PHP (₱) - Philippine Peso</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>

              <div>
                <label htmlFor="timezone" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Timezone</label>
                <select 
                  id="timezone" 
                  name="timezone" 
                  defaultValue={profile?.timezone || 'Asia/Manila'} 
                  className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
                >
                  <option value="Asia/Manila">Asia/Manila (PHT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPendingProfile}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {isPendingProfile ? 'Saving...' : <><Check className="w-4 h-4" /> Save Profile</>}
              </button>
            </form>
          </div>

          <div className="card border-danger/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-danger-light rounded-lg text-danger">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Sign out of your account on this device.
            </p>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 border border-danger/30 text-danger bg-danger-light/50 font-semibold rounded-xl py-3 hover:bg-danger hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Right Column: App Preferences */}
        <div className="space-y-8">
          <div className="card p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-light rounded-lg text-primary">
                <Settings2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-primary">App Preferences</h2>
            </div>

            <form id="prefs-form" onSubmit={handlePrefsSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-primary/80 mb-3 uppercase tracking-wider">Theme</label>
                <div className="flex bg-surface-raised p-1 rounded-xl w-full">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex-1 text-center py-2 text-sm rounded-lg capitalize cursor-pointer transition-colors ${
                        theme === t 
                          ? 'bg-primary-light text-primary font-bold shadow-sm' 
                          : 'text-text-secondary font-medium hover:text-text hover:bg-white/50'
                      }`}
                    >
                      <input type="radio" name="theme" value={t} defaultChecked={theme === t} className="hidden" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="default_budget_method" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">Default Budget Method</label>
                <select 
                  id="default_budget_method" 
                  name="default_budget_method" 
                  defaultValue={defaultMethod} 
                  className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
                >
                  <option value="custom">Custom (Zero-based)</option>
                  <option value="50/30/20">50/30/20 Rule</option>
                </select>
              </div>

              <div>
                <label htmlFor="first_day_of_month" className="block text-xs font-semibold text-primary/80 mb-1.5 uppercase tracking-wider">First Day of Month</label>
                <select 
                  id="first_day_of_month" 
                  name="first_day_of_month" 
                  defaultValue={preferences?.first_day_of_month || 1} 
                  className="input-base hover:border-primary/50 focus:border-primary focus:ring-[3px] focus:ring-primary-light text-primary"
                >
                  <option value="1">1st of the month</option>
                  <option value="15">15th of the month</option>
                </select>
                <p className="text-xs text-text-tertiary mt-1.5">When does your financial month start?</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary/80 mb-3 uppercase tracking-wider">Budget Rollover</label>
                <label className="flex items-center justify-between cursor-pointer group p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  <div>
                    <div className="font-semibold text-primary">Enable Rollover</div>
                    <div className="text-xs text-text-secondary mt-0.5">Unspent budget carries over to next month</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${rollover ? 'bg-primary' : 'bg-stone-300'}`}>
                    <input type="hidden" name="budget_rollover" value={rollover ? 'true' : 'false'} />
                    <div 
                      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${rollover ? 'translate-x-6' : 'translate-x-0'}`}
                      onClick={() => setRollover(!rollover)}
                    />
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={isPendingPrefs}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold rounded-xl py-3 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {isPendingPrefs ? 'Saving...' : <><Check className="w-4 h-4" /> Save Preferences</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-danger-light text-danger mx-auto flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">Sign Out?</h3>
            <p className="text-text-secondary mb-6 text-sm">
              Are you sure you want to sign out? You will need to log in again to access your budget.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-2.5 font-semibold text-primary/70 hover:bg-primary-light/50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-2.5 bg-danger text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
