import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'email' | 'invite' | null
  const code = searchParams.get('code')

  const cookieStore = await cookies()
  let responseCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          responseCookies = [...responseCookies, ...cookiesToSet]
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch {}
          })
        },
      },
    }
  )

  let redirectTo = '/'
  let hasError = false

  // PKCE flow: exchange code for session (used by inviteUserByEmail redirect)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      redirectTo = '/auth/error'
      hasError = true
    } else if (type === 'invite') {
      redirectTo = '/set-password'
    }
  } else if (token_hash && type) {
    // OTP flow: verify token_hash (used by copy-link invite links)
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) {
      redirectTo = '/auth/error'
      hasError = true
    } else if (type === 'invite') {
      redirectTo = '/set-password'
    }
  } else {
    redirectTo = '/auth/error'
    hasError = true
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  // Explicitly set session cookies on the redirect response so the browser
  // receives them — cookies set via cookieStore.set() may not propagate
  // to NextResponse.redirect() in Route Handlers.
  if (!hasError) {
    responseCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
  }

  return response
}
