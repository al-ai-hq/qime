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

const mockAdminSupabase = {
  auth: {
    admin: {
      listUsers: vi.fn(),
    },
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
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
    process.env.ADMIN_EMAIL = 'admin@example.com'
  })

  describe('POST /api/auth/signup', () => {
    it('returns 201 on valid admin signup', async () => {
      mockAdminSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: 'admin@example.com' },
          session: null,
        },
        error: null,
      })

      const request = createRequest({
        email: 'admin@example.com',
        password: 'password123',
        full_name: 'Admin User',
      })

      const response = await signupPOST(request)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.user).toEqual({ id: 'new-user-id', email: 'admin@example.com' })
      expect(json.message).toContain('confirmation')
    })

    it('returns 403 for non-admin email', async () => {
      const request = createRequest({
        email: 'user@example.com',
        password: 'password123',
        full_name: 'Regular User',
      })

      const response = await signupPOST(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Signup is disabled')
    })

    it('returns 403 when admin already exists', async () => {
      mockAdminSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-admin', email: 'admin@example.com' }] },
        error: null,
      })

      const request = createRequest({
        email: 'admin@example.com',
        password: 'password123',
        full_name: 'Admin User',
      })

      const response = await signupPOST(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Admin account already exists')
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
        email: 'admin@example.com',
        password: 'short',
      })

      const response = await signupPOST(request)
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error).toBeDefined()
    })

    it('returns error when Supabase signup fails', async () => {
      mockAdminSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 422 },
      })

      const request = createRequest({
        email: 'admin@example.com',
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
