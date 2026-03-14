import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase server client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

// Mock the admin client (used for org creation to bypass RLS)
const mockAdminSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

import { POST, GET } from '@/app/api/organizations/route'

function createRequest(method: string, body?: unknown) {
  return new Request('http://localhost:3000/api/organizations', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

const mockAdminUser = {
  id: 'test-user-id',
  email: 'admin@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

const mockRegularUser = {
  id: 'regular-user-id',
  email: 'user@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

function mockAuthenticated(user = mockAdminUser) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  })
}

function mockUnauthenticated() {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  })
}

function mockOrgCount(count: number) {
  const selectMock = vi.fn().mockResolvedValue({ count, error: null })
  mockAdminSupabase.from.mockImplementation((table: string) => {
    if (table === 'organizations') {
      return { select: selectMock }
    }
    return {}
  })
  return selectMock
}

describe('Organizations API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = 'admin@example.com'
  })

  describe('POST /api/organizations', () => {
    it('creates an organization and adds owner membership', async () => {
      mockAuthenticated()

      const mockOrg = { id: 'org-123', name: 'Test Org', created_by: mockAdminUser.id }
      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({ data: mockOrg, error: null })
      const memberInsertMock = vi.fn().mockResolvedValue({ data: null, error: null })
      const countSelectMock = vi.fn().mockResolvedValue({ count: 0, error: null })

      mockAdminSupabase.from.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return { insert: insertMock, select: countSelectMock }
        }
        if (table === 'organization_members') {
          return { insert: memberInsertMock }
        }
        return {}
      })

      // Chain: insert -> select -> single
      insertMock.mockReturnValue({ select: selectMock })
      selectMock.mockReturnValue({ single: singleMock })

      const request = createRequest('POST', { name: 'Test Org' })
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json).toEqual({ organization: mockOrg })
      expect(memberInsertMock).toHaveBeenCalledWith({
        organization_id: 'org-123',
        user_id: mockAdminUser.id,
        role: 'owner',
      })
    })

    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticated()

      const request = createRequest('POST', { name: 'Test Org' })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('returns 400 for invalid body', async () => {
      mockAuthenticated()

      const request = createRequest('POST', { name: '' })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 403 for non-admin user', async () => {
      mockAuthenticated(mockRegularUser)

      const request = createRequest('POST', { name: 'Test Org' })
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Only the admin can create organizations')
    })

    it('returns 409 when org already exists', async () => {
      mockAuthenticated()

      mockAdminSupabase.from.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return { select: vi.fn().mockResolvedValue({ count: 1, error: null }) }
        }
        return {}
      })

      const request = createRequest('POST', { name: 'Second Org' })
      const response = await POST(request)
      const json = await response.json()

      expect(response.status).toBe(409)
      expect(json.error).toBe('An organization already exists')
    })
  })

  describe('GET /api/organizations', () => {
    it('lists organizations for authenticated user', async () => {
      mockAuthenticated()

      const mockMemberships = [
        {
          role: 'owner',
          organizations: { id: 'org-1', name: 'Org One' },
        },
        {
          role: 'member',
          organizations: { id: 'org-2', name: 'Org Two' },
        },
      ]

      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ data: mockMemberships, error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return { select: selectMock, eq: eqMock }
        }
        return {}
      })

      selectMock.mockReturnValue({ eq: eqMock })

      const request = createRequest('GET')
      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toEqual([
        { id: 'org-1', name: 'Org One', role: 'owner' },
        { id: 'org-2', name: 'Org Two', role: 'member' },
      ])
    })

    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticated()

      const response = await GET()
      expect(response.status).toBe(401)
    })
  })
})
