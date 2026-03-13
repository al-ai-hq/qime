import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

import { DELETE } from '@/app/api/organizations/[orgId]/platforms/route'

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

function createRequest(method: string, body?: unknown) {
  return new Request('http://localhost:3000/api/organizations/org-123/platforms', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

const params = Promise.resolve({ orgId: 'org-123' })

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

function mockMembershipChain(data: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data, error: null }),
        }),
      }),
    }),
  }
}

function mockOrgMember() {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'organization_members') {
      return mockMembershipChain({ role: 'owner' })
    }
    if (table === 'organization_platforms') {
      return {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }
    }
    return {}
  })
}

function mockNonMember() {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'organization_members') {
      return mockMembershipChain(null)
    }
    return {}
  })
}

describe('Platforms API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DELETE /api/organizations/[orgId]/platforms', () => {
    it('returns 204 on successful platform removal', async () => {
      mockAuthenticated()
      mockOrgMember()

      const request = createRequest('DELETE', { platform_id: 'chatgpt' })
      const response = await DELETE(request, { params })

      expect(response.status).toBe(204)
    })

    it('returns 400 when platform_id is missing from body', async () => {
      mockAuthenticated()
      mockOrgMember()

      const request = createRequest('DELETE', {})
      const response = await DELETE(request, { params })

      expect(response.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticated()

      const request = createRequest('DELETE', { platform_id: 'chatgpt' })
      const response = await DELETE(request, { params })

      expect(response.status).toBe(401)
    })

    it('returns 403 when not an org member', async () => {
      mockAuthenticated()
      mockNonMember()

      const request = createRequest('DELETE', { platform_id: 'chatgpt' })
      const response = await DELETE(request, { params })

      expect(response.status).toBe(403)
    })
  })
})
