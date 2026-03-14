import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'email' | 'invite' | null
  const code = searchParams.get('code')

  const supabase = await createClient()

  // PKCE flow: exchange code for session (used by inviteUserByEmail redirect)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/auth/error', request.url))
    }
    // If type=invite was passed as a query param alongside the code, redirect to set-password
    if (type === 'invite') {
      return NextResponse.redirect(new URL('/set-password', request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // OTP flow: verify token_hash (used by copy-link invite links)
  if (!token_hash || !type) {
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  // Invited users need to set a password before they can use their account
  if (type === 'invite') {
    return NextResponse.redirect(new URL('/set-password', request.url))
  }

  return NextResponse.redirect(new URL('/', request.url))
}
