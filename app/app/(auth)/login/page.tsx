'use client'
// app/(auth)/login/page.tsx
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      // Never expose raw errors (Decision Log implementation rule)
      if (signInError.message.includes('Email not confirmed')) {
        setError('Please verify your email first. Check your inbox for the verification link.')
      } else if (signInError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError('Something went wrong. Please try again later.')
      }
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="card card-lg animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display text-text mb-1">Welcome back</h1>
        <p className="text-text-secondary text-sm">Sign in to your BudgetPlan account</p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl bg-danger-light border border-red-200 dark:border-red-900/50 p-4 mb-6 animate-slide-down"
        >
          <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form id="login-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-text">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-base"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-text">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-base pr-12"
              disabled={loading}
            />
            <button
              type="button"
              aria-label={showPw ? 'Hide password' : 'Show password'}
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text p-1 rounded-lg transition-colors min-h-0 min-w-0"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 bg-surface cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary cursor-pointer">
              Remember me
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="bg-primary hover:bg-[#54281f] text-white w-full flex items-center justify-center py-2.5 mt-2 rounded-xl font-medium transition-colors shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <LogIn className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
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
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">
          Create account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="card card-lg animate-pulse">
        <div className="h-8 skeleton mb-6 w-48" />
        <div className="space-y-5">
          <div className="h-12 skeleton" />
          <div className="h-12 skeleton" />
          <div className="h-12 skeleton" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
