import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase server client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

// Mock the admin client
const mockAdminSupabase = {
  from: vi.fn(),
  auth: {
    admin: {
      getUserById: vi.fn(),
      listUsers: vi.fn(),
      inviteUserByEmail: vi.fn(),
      generateLink: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

import { GET } from '@/app/api/organizations/[orgId]/members/route'
import { POST as InvitePOST } from '@/app/api/organizations/[orgId]/members/invite/route'
import { DELETE } from '@/app/api/organizations/[orgId]/members/[memberId]/route'
import { POST as ResendPOST } from '@/app/api/organizations/[orgId]/members/[memberId]/resend/route'

const mockUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

function createRequest(method: string, body?: unknown) {
  return new Request('http://localhost:3000/api/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
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

// Helper to set up chained supabase query mocks
function mockFromChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    order: vi.fn().mockResolvedValue(resolvedValue),
    limit: vi.fn().mockResolvedValue(resolvedValue),
  }
  return chain
}

describe('Members API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/organizations/[orgId]/members', () => {
    it('returns 401 when not authenticated', async () => {
      mockUnauthenticated()
      const res = await GET(createRequest('GET'), {
        params: Promise.resolve({ orgId: 'org-1' }),
      })
      expect(res.status).toBe(401)
    })

    it('returns 403 when not a member', async () => {
      mockAuthenticated()
      const membershipChain = mockFromChain({ data: null, error: null })
      mockSupabase.from.mockReturnValue(membershipChain)

      const res = await GET(createRequest('GET'), {
        params: Promise.resolve({ orgId: 'org-1' }),
      })
      expect(res.status).toBe(403)
    })

    it('returns enriched members with email and status', async () => {
      mockAuthenticated()

      const members = [
        { id: 'mem-1', user_id: 'user-1', role: 'owner', created_at: '2024-01-01' },
        { id: 'mem-2', user_id: 'user-2', role: 'member', created_at: '2024-01-02' },
      ]

      // First call: checkOrgMembership -> returns role
      // Second call: fetch members -> returns list
      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          // checkOrgMembership
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        // fetch members
        return mockFromChain({ data: members, error: null })
      })

      mockAdminSupabase.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: { user: { email: 'owner@test.com', user_metadata: { full_name: 'Owner' }, last_sign_in_at: '2024-01-01' } },
        })
        .mockResolvedValueOnce({
          data: { user: { email: 'member@test.com', user_metadata: {}, last_sign_in_at: null } },
        })

      const res = await GET(createRequest('GET'), {
        params: Promise.resolve({ orgId: 'org-1' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.members).toHaveLength(2)
      expect(body.members[0].user_email).toBe('owner@test.com')
      expect(body.members[0].status).toBe('active')
      expect(body.members[1].user_email).toBe('member@test.com')
      expect(body.members[1].status).toBe('pending')
    })
  })

  describe('POST /api/organizations/[orgId]/members/invite', () => {
    it('returns 401 when not authenticated', async () => {
      mockUnauthenticated()
      const res = await InvitePOST(
        createRequest('POST', { email: 'new@test.com', mode: 'send_email' }),
        { params: Promise.resolve({ orgId: 'org-1' }) },
      )
      expect(res.status).toBe(401)
    })

    it('returns 403 for non-admin members', async () => {
      mockAuthenticated()
      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        return mockFromChain({ data: { role: 'member' }, error: null })
      })

      const res = await InvitePOST(
        createRequest('POST', { email: 'new@test.com', mode: 'send_email' }),
        { params: Promise.resolve({ orgId: 'org-1' }) },
      )
      expect(res.status).toBe(403)
    })

    it('invites new user via email using inviteUserByEmail', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        if (fromCallCount === 2) {
          // already member check
          return mockFromChain({ data: null, error: { code: 'PGRST116' } })
        }
        // insert
        return mockFromChain({
          data: { id: 'mem-new', organization_id: 'org-1', user_id: 'new-user-id', role: 'member', created_at: '2024-01-01' },
          error: null,
        })
      })

      mockAdminSupabase.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
      mockAdminSupabase.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-user-id' } },
        error: null,
      })

      const res = await InvitePOST(
        createRequest('POST', { email: 'new@test.com', mode: 'send_email' }),
        { params: Promise.resolve({ orgId: 'org-1' }) },
      )
      expect(res.status).toBe(201)
      expect(mockAdminSupabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('new@test.com', {
        redirectTo: 'http://localhost:3000/api/auth/confirm?type=invite',
      })
    })

    it('generates invite link for copy_link mode', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        if (fromCallCount === 2) {
          return mockFromChain({ data: null, error: { code: 'PGRST116' } })
        }
        return mockFromChain({
          data: { id: 'mem-new', organization_id: 'org-1', user_id: 'new-user-id', role: 'member', created_at: '2024-01-01' },
          error: null,
        })
      })

      mockAdminSupabase.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
      mockAdminSupabase.auth.admin.generateLink.mockResolvedValue({
        data: {
          user: { id: 'new-user-id' },
          properties: { hashed_token: 'abc123hash' },
        },
        error: null,
      })

      const res = await InvitePOST(
        createRequest('POST', { email: 'new@test.com', mode: 'copy_link' }),
        { params: Promise.resolve({ orgId: 'org-1' }) },
      )
      expect(res.status).toBe(201)

      const body = await res.json()
      expect(body.invite_link).toBe('http://localhost:3000/api/auth/confirm?token_hash=abc123hash&type=invite')
      expect(mockAdminSupabase.auth.admin.generateLink).toHaveBeenCalledWith({
        type: 'invite',
        email: 'new@test.com',
      })
    })

    it('returns 409 when user is already a member', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        // already member check returns existing
        return mockFromChain({ data: { id: 'existing-mem' }, error: null })
      })

      mockAdminSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'existing-user', email: 'exists@test.com', last_sign_in_at: '2024-01-01' }] },
      })

      const res = await InvitePOST(
        createRequest('POST', { email: 'exists@test.com', mode: 'send_email' }),
        { params: Promise.resolve({ orgId: 'org-1' }) },
      )
      expect(res.status).toBe(409)
    })
  })

  describe('DELETE /api/organizations/[orgId]/members/[memberId]', () => {
    it('returns 401 when not authenticated', async () => {
      mockUnauthenticated()
      const res = await DELETE(createRequest('DELETE'), {
        params: Promise.resolve({ orgId: 'org-1', memberId: 'mem-1' }),
      })
      expect(res.status).toBe(401)
    })

    it('returns 403 when trying to remove the owner', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'admin' }, error: null })
        }
        // target member is owner
        return mockFromChain({ data: { id: 'mem-1', user_id: 'owner-id', role: 'owner' }, error: null })
      })

      const res = await DELETE(createRequest('DELETE'), {
        params: Promise.resolve({ orgId: 'org-1', memberId: 'mem-1' }),
      })
      expect(res.status).toBe(403)
    })

    it('deletes member and cleans up pending auth user', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        if (fromCallCount === 2) {
          // target member
          return mockFromChain({ data: { id: 'mem-2', user_id: 'pending-user', role: 'member' }, error: null })
        }
        if (fromCallCount === 3) {
          // delete
          const chain = mockFromChain({ data: null, error: null })
          chain.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
          return chain
        }
        // other memberships check
        return mockFromChain({ data: [], error: null })
      })

      mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: 'pending-user', last_sign_in_at: null } },
      })
      mockAdminSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

      const res = await DELETE(createRequest('DELETE'), {
        params: Promise.resolve({ orgId: 'org-1', memberId: 'mem-2' }),
      })
      expect(res.status).toBe(204)
      expect(mockAdminSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('pending-user')
    })
  })

  describe('POST /api/organizations/[orgId]/members/[memberId]/resend', () => {
    it('returns 401 when not authenticated', async () => {
      mockUnauthenticated()
      const res = await ResendPOST(
        createRequest('POST', { mode: 'send_email' }),
        { params: Promise.resolve({ orgId: 'org-1', memberId: 'mem-1' }) },
      )
      expect(res.status).toBe(401)
    })

    it('returns 400 when user already accepted invitation', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        return mockFromChain({ data: { id: 'mem-1', user_id: 'active-user' }, error: null })
      })

      mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: 'active-user', email: 'active@test.com', last_sign_in_at: '2024-01-01' } },
      })

      const res = await ResendPOST(
        createRequest('POST', { mode: 'send_email' }),
        { params: Promise.resolve({ orgId: 'org-1', memberId: 'mem-1' }) },
      )
      expect(res.status).toBe(400)
    })

    it('resends invite email for pending user', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        return mockFromChain({ data: { id: 'mem-1', user_id: 'pending-user' }, error: null })
      })

      mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: 'pending-user', email: 'pending@test.com', last_sign_in_at: null } },
      })
      mockAdminSupabase.auth.admin.inviteUserByEmail.mockResolvedValue({ error: null })

      const res = await ResendPOST(
        createRequest('POST', { mode: 'send_email' }),
        { params: Promise.resolve({ orgId: 'org-1', memberId: 'mem-1' }) },
      )
      expect(res.status).toBe(200)
      expect(mockAdminSupabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('pending@test.com', {
        redirectTo: 'http://localhost:3000/api/auth/confirm?type=invite',
      })
    })

    it('generates invite link for copy_link mode', async () => {
      mockAuthenticated()

      let fromCallCount = 0
      mockSupabase.from.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          return mockFromChain({ data: { role: 'owner' }, error: null })
        }
        return mockFromChain({ data: { id: 'mem-1', user_id: 'pending-user' }, error: null })
      })

      mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: { id: 'pending-user', email: 'pending@test.com', last_sign_in_at: null } },
      })
      mockAdminSupabase.auth.admin.generateLink.mockResolvedValue({
        data: { properties: { hashed_token: 'resend-hash-123' } },
        error: null,
      })

      const res = await ResendPOST(
        createRequest('POST', { mode: 'copy_link' }),
        { params: Promise.resolve({ orgId: 'org-1', memberId: 'mem-1' }) },
      )
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.invite_link).toBe('http://localhost:3000/api/auth/confirm?token_hash=resend-hash-123&type=invite')
    })
  })
})
