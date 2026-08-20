'use client'
// app/(auth)/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
  ]
  if (!password) return null
  return (
    <ul className="mt-2 space-y-1">
      {checks.map(c => (
        <li key={c.label} className={`flex items-center gap-2 text-xs ${c.pass ? 'text-success' : 'text-text-secondary'}`}>
          <CheckCircle2 className={`w-3 h-3 shrink-0 ${c.pass ? 'text-success' : 'text-border'}`} />
          {c.label}
        </li>
      ))}
    </ul>
  )
}

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const passwordsMatch = password === confirm
  const passwordValid  = password.length >= 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!passwordValid) { setError('Password must be at least 8 characters.'); return }
    if (!passwordsMatch) { setError('Passwords do not match.'); return }

    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // stored in auth.users.raw_user_meta_data → picked up by trigger
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('This email is already registered. Try signing in instead.')
      } else {
        // Show exact error message to help debug
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    router.push('/verify-pending')
  }

  return (
    <div className="card card-lg animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display text-text mb-1">Create your account</h1>
        <p className="text-text-secondary text-sm">Start taking control of your finances today</p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-danger-light border border-red-200 dark:border-red-900/50 p-4 mb-6 animate-slide-down">
          <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form id="register-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="register-name" className="text-sm font-medium text-text">Full name</label>
          <input id="register-name" type="text" autoComplete="name" required value={name}
            onChange={e => setName(e.target.value)} placeholder="Juan dela Cruz"
            className="input-base" disabled={loading} />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium text-text">Email address</label>
          <input id="register-email" type="email" autoComplete="email" required value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            className="input-base" disabled={loading} />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium text-text">Password</label>
          <div className="relative">
            <input id="register-password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className="input-base pr-12" disabled={loading} />
            <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text p-1 rounded-lg transition-colors min-h-0 min-w-0">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="register-confirm" className="text-sm font-medium text-text">Confirm password</label>
          <input id="register-confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password"
            required value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={`input-base ${confirm && !passwordsMatch ? 'border-danger focus:ring-danger' : ''}`}
            disabled={loading} />
          {confirm && !passwordsMatch && (
            <p className="text-xs text-danger">Passwords do not match</p>
          )}
        </div>

        <button type="submit" id="register-submit"
          disabled={loading || !name || !email || !passwordValid}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
          ) : (
            <><UserPlus className="w-4 h-4" />Create account</>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  )
}
