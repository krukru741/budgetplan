'use client'
// app/(auth)/reset-password/page.tsx
// Handles the password reset after user clicks link from email (Decision Log #5)
// Supabase passes the token via URL hash — @supabase/ssr exchanges it automatically
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase exchanges the reset token from the URL hash on load
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
  }, [])

  const passwordsMatch = password === confirm
  const passwordValid  = password.length >= 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!passwordValid) { setError('Password must be at least 8 characters.'); return }
    if (!passwordsMatch) { setError('Passwords do not match.'); return }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError('Could not update password. The reset link may have expired. Request a new one.')
      return
    }

    setSuccess(true)
    // Sign out all other sessions after password reset (Decision Log #5)
    await supabase.auth.signOut({ scope: 'others' })

    setTimeout(() => router.push('/login'), 2500)
  }

  if (success) {
    return (
      <div className="card card-lg animate-scale-in text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-success" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-2xl font-bold font-display text-text mb-2">Password updated!</h1>
        <p className="text-text-secondary text-sm">
          Your password has been changed successfully. Redirecting you to sign in…
        </p>
      </div>
    )
  }

  return (
    <div className="card card-lg animate-fade-in">
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-display text-text mb-1">Set a new password</h1>
        <p className="text-text-secondary text-sm">Choose a strong password for your account.</p>
      </div>

      {!sessionReady && (
        <div className="rounded-xl bg-warning-light border border-yellow-200 dark:border-yellow-900/50 p-4 mb-6">
          <p className="text-sm text-warning font-medium">Loading your session… please wait.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-danger-light border border-red-200 dark:border-red-900/50 p-4 mb-6 animate-slide-down">
          <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="reset-password" className="text-sm font-medium text-text">New password</label>
          <div className="relative">
            <input id="reset-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className="input-base pr-12" disabled={loading || !sessionReady} />
            <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text p-1 rounded-lg transition-colors min-h-0 min-w-0">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="reset-confirm" className="text-sm font-medium text-text">Confirm new password</label>
          <input id="reset-confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password"
            required value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={`input-base ${confirm && !passwordsMatch ? 'border-danger focus:ring-danger' : ''}`}
            disabled={loading || !sessionReady} />
          {confirm && !passwordsMatch && <p className="text-xs text-danger">Passwords do not match</p>}
        </div>

        <button type="submit" id="reset-password-submit"
          disabled={loading || !sessionReady || !passwordValid}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating…</>
            : <><KeyRound className="w-4 h-4" />Update password</>}
        </button>
      </form>
    </div>
  )
}
