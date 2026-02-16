import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase server client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { POST as signupPOST } from '@/app/api/auth/signup/route'
import { POST as loginPOST } from '@/app/api/auth/login/route'

function createRequest(body: unknown) {
  return new Request('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    it('returns 201 on valid signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: 'new@example.com' },
          session: null,
        },
        error: null,
      })

      const request = createRequest({
        email: 'new@example.com',
        password: 'password123',
        full_name: 'New User',
      })

      const response = await signupPOST(request)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.user).toEqual({ id: 'new-user-id', email: 'new@example.com' })
      expect(json.message).toContain('confirmation')
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: { data: { full_name: 'New User' } },
      })
    })

    it('returns 400 for missing email', async () => {
      const request = createRequest({
        password: 'password123',
      })

      const response = await signupPOST(request)
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error).toBeDefined()
    })

    it('returns 400 for short password', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'short',
      })

      const response = await signupPOST(request)
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error).toBeDefined()
    })

    it('returns error when Supabase signup fails', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 422 },
      })

      const request = createRequest({
        email: 'existing@example.com',
        password: 'password123',
      })

      const response = await signupPOST(request)
      expect(response.status).toBe(422)

      const json = await response.json()
      expect(json.error).toBe('User already registered')
    })
  })

  describe('POST /api/auth/login', () => {
    it('returns 200 with user and session on valid login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-id', email: 'test@example.com' },
          session: { access_token: 'token-123', expires_at: 1700000000 },
        },
        error: null,
      })

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await loginPOST(request)
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.user).toEqual({ id: 'user-id', email: 'test@example.com' })
      expect(json.session).toEqual({ access_token: 'token-123', expires_at: 1700000000 })
    })

    it('returns 401 for invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 401 },
      })

      const request = createRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      const response = await loginPOST(request)
      expect(response.status).toBe(401)

      const json = await response.json()
      expect(json.error).toBe('Invalid login credentials')
    })

    it('returns 400 for missing fields', async () => {
      const request = createRequest({})

      const response = await loginPOST(request)
      expect(response.status).toBe(400)
    })
  })
})
