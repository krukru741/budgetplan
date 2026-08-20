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

        <div className="pt-2">
          <button type="submit" id="register-submit"
            disabled={loading}
            className="bg-primary hover:bg-[#54281f] text-white w-full flex items-center justify-center py-2.5 rounded-xl font-medium transition-colors shadow-sm">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create account
                <UserPlus className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Social Login */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-surface text-text-tertiary">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-border rounded-xl shadow-sm bg-surface text-sm font-medium text-text hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-text-secondary mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  )
}
