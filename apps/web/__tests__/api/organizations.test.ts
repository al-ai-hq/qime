import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase server client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { POST, GET } from '@/app/api/organizations/route'

function createRequest(method: string, body?: unknown) {
  return new Request('http://localhost:3000/api/organizations', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

function mockAuthenticated() {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  })
}

function mockUnauthenticated() {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  })
}

describe('Organizations API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/organizations', () => {
    it('creates an organization and adds owner membership', async () => {
      mockAuthenticated()

      const mockOrg = { id: 'org-123', name: 'Test Org', created_by: mockUser.id }
      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({ data: mockOrg, error: null })
      const memberInsertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organizations') {
          return { insert: insertMock, select: selectMock, single: singleMock }
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
      expect(json).toEqual(mockOrg)
      expect(memberInsertMock).toHaveBeenCalledWith({
        organization_id: 'org-123',
        user_id: mockUser.id,
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
