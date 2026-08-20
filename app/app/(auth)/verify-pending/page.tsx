'use client'
// app/(auth)/verify-pending/page.tsx
// Shown after registration while email is unverified (Decision Log #5)
import { useState } from 'react'
import { MailCheck, RefreshCw, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyPendingPage() {
  const [resending, setResending]     = useState(false)
  const [resendDone, setResendDone]   = useState(false)
  const [cooldown, setCooldown]       = useState(0)
  const [error, setError]             = useState<string | null>(null)

  async function handleResend() {
    if (cooldown > 0) return
    setError(null)
    setResending(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      setError('Session expired. Please go back and register again.')
      setResending(false)
      return
    }

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    setResending(false)

    if (resendError) {
      setError('Could not resend the email. Please try again in a moment.')
      return
    }

    setResendDone(true)
    // Start cooldown
    setCooldown(RESEND_COOLDOWN_SECONDS)
    const interval = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  return (
    <div className="card card-lg animate-scale-in text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
          <MailCheck className="w-9 h-9 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="text-2xl font-bold font-display text-text mb-2">Check your email</h1>
      <p className="text-text-secondary text-sm mb-2">
        We sent a verification link to your email address.
      </p>
      <p className="text-text-secondary text-sm mb-8">
        Click the link in the email to activate your account — you&apos;ll be logged in automatically.
      </p>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-danger-light border border-red-200 dark:border-red-900/50 p-4 mb-6 text-left animate-slide-down">
          <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {resendDone && !error && (
        <div className="rounded-xl bg-success-light border border-green-200 dark:border-green-900/50 p-4 mb-6 animate-slide-down">
          <p className="text-sm text-success font-medium">Verification email resent! Check your inbox.</p>
        </div>
      )}

      {/* Resend button */}
      <button
        id="resend-verification"
        onClick={handleResend}
        disabled={resending || cooldown > 0}
        className="flex items-center justify-center gap-2 mx-auto text-sm text-primary hover:text-primary-hover font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
        {resending
          ? 'Resending…'
          : cooldown > 0
          ? `Resend in ${cooldown}s`
          : "Didn't receive it? Resend email"}
      </button>

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-xs text-text-tertiary">
          Wrong email?{' '}
          <a href="/register" className="text-primary hover:text-primary-hover font-medium">
            Go back and register again
          </a>
        </p>
      </div>
    </div>
  )
}
