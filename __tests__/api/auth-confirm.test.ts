import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase client for the confirm route (which uses @supabase/ssr directly)
const mockConfirmSupabase = {
  auth: {
    verifyOtp: vi.fn(),
    exchangeCodeForSession: vi.fn(),
  },
}

let capturedCookieConfig: { setAll: (cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>) => void } | null = null

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn((_url: string, _key: string, config: { cookies: typeof capturedCookieConfig }) => {
    capturedCookieConfig = config.cookies
    return mockConfirmSupabase
  }),
}))

import { GET as confirmGET } from '@/app/api/auth/confirm/route'

function createConfirmRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/auth/confirm')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new Request(url.toString(), { method: 'GET' })
}

describe('GET /api/auth/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedCookieConfig = null
  })

  it('redirects to /set-password for invite tokens', async () => {
    mockConfirmSupabase.auth.verifyOtp.mockResolvedValue({ error: null })

    const response = await confirmGET(
      createConfirmRequest({ token_hash: 'abc123', type: 'invite' })
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/set-password')
    expect(mockConfirmSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'abc123',
      type: 'invite',
    })
  })

  it('redirects to / for signup tokens', async () => {
    mockConfirmSupabase.auth.verifyOtp.mockResolvedValue({ error: null })

    const response = await confirmGET(
      createConfirmRequest({ token_hash: 'abc123', type: 'signup' })
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/')
  })

  it('redirects to /auth/error when verification fails', async () => {
    mockConfirmSupabase.auth.verifyOtp.mockResolvedValue({
      error: { message: 'Token expired' },
    })

    const response = await confirmGET(
      createConfirmRequest({ token_hash: 'expired', type: 'invite' })
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/auth/error')
  })

  it('redirects to /auth/error when params are missing', async () => {
    const response = await confirmGET(
      createConfirmRequest({})
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/auth/error')
  })

  it('exchanges PKCE code and redirects to /set-password for invite', async () => {
    mockConfirmSupabase.auth.exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await confirmGET(
      createConfirmRequest({ code: 'pkce-code-123', type: 'invite' })
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/set-password')
    expect(mockConfirmSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code-123')
  })

  it('exchanges PKCE code and redirects to / for non-invite', async () => {
    mockConfirmSupabase.auth.exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await confirmGET(
      createConfirmRequest({ code: 'pkce-code-123' })
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/')
  })

  it('redirects to /auth/error when code exchange fails', async () => {
    mockConfirmSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      error: { message: 'Invalid code' },
    })

    const response = await confirmGET(
      createConfirmRequest({ code: 'bad-code' })
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/auth/error')
  })

  it('sets session cookies on the redirect response for OTP flow', async () => {
    mockConfirmSupabase.auth.verifyOtp.mockImplementation(() => {
      // Simulate Supabase setting session cookies during verification
      capturedCookieConfig!.setAll([
        { name: 'sb-access-token', value: 'token-123', options: { path: '/' } },
        { name: 'sb-refresh-token', value: 'refresh-456', options: { path: '/' } },
      ])
      return { error: null }
    })

    const response = await confirmGET(
      createConfirmRequest({ token_hash: 'abc123', type: 'invite' })
    )

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/set-password')

    const setCookieHeaders = response.headers.getSetCookie()
    expect(setCookieHeaders.some((c: string) => c.includes('sb-access-token=token-123'))).toBe(true)
    expect(setCookieHeaders.some((c: string) => c.includes('sb-refresh-token=refresh-456'))).toBe(true)
  })

  it('sets session cookies on the redirect response for PKCE flow', async () => {
    mockConfirmSupabase.auth.exchangeCodeForSession.mockImplementation(() => {
      capturedCookieConfig!.setAll([
        { name: 'sb-access-token', value: 'pkce-token', options: { path: '/' } },
      ])
      return { error: null }
    })

    const response = await confirmGET(
      createConfirmRequest({ code: 'pkce-code', type: 'invite' })
    )

    const setCookieHeaders = response.headers.getSetCookie()
    expect(setCookieHeaders.some((c: string) => c.includes('sb-access-token=pkce-token'))).toBe(true)
  })

  it('does not set session cookies on error redirects', async () => {
    mockConfirmSupabase.auth.verifyOtp.mockImplementation(() => {
      // Supabase might still emit cookies even on error
      capturedCookieConfig!.setAll([
        { name: 'sb-access-token', value: 'stale', options: { path: '/' } },
      ])
      return { error: { message: 'Token expired' } }
    })

    const response = await confirmGET(
      createConfirmRequest({ token_hash: 'expired', type: 'invite' })
    )

    expect(new URL(response.headers.get('location')!).pathname).toBe('/auth/error')
    const setCookieHeaders = response.headers.getSetCookie()
    expect(setCookieHeaders.some((c: string) => c.includes('sb-access-token=stale'))).toBe(false)
  })
})
