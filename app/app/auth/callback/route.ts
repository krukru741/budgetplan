// app/auth/callback/route.ts
// Handles the email verification redirect and auto-login (Decision Log #5)
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Auto-login successful — redirect to dashboard (Decision Log #5)
      const redirectUrl = requestUrl.origin + next
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Token invalid or expired — redirect to error page
  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=verification_failed`
  )
}
