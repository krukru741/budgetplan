'use client'
// app/(auth)/forgot-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError('Something went wrong. Please try again later.')
      return
    }

    // Always show success — don't reveal if email is registered (security)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="card card-lg animate-scale-in text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-success" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-2xl font-bold font-display text-text mb-2">Check your email</h1>
        <p className="text-text-secondary text-sm mb-8">
          If an account exists for <span className="font-semibold text-text">{email}</span>,
          we&apos;ve sent a password reset link. It expires in 1 hour.
        </p>
        <Link href="/login"
          className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 px-6 transition-all duration-200 active:scale-[0.98]">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="card card-lg animate-fade-in">
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-display text-text mb-1">Reset your password</h1>
        <p className="text-text-secondary text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-danger-light border border-red-200 dark:border-red-900/50 p-4 mb-6 animate-slide-down">
          <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form id="forgot-password-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="text-sm font-medium text-text">Email address</label>
          <input id="forgot-email" type="email" autoComplete="email" required value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            className="input-base" disabled={loading} />
        </div>

        <button type="submit" id="forgot-password-submit" disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
            : <><Send className="w-4 h-4" />Send reset link</>}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        Remembered your password?{' '}
        <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  )
}
