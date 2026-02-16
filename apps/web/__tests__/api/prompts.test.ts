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

import { POST, GET } from '@/app/api/organizations/[orgId]/prompts/route'

const TEST_ORG_ID = 'test-org-id'
const TEST_USER_ID = 'test-user-id'

const mockUser = {
  id: TEST_USER_ID,
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

function createRequest(method: string, body?: unknown, queryParams?: string) {
  const url = `http://localhost:3000/api/organizations/${TEST_ORG_ID}/prompts${queryParams ? `?${queryParams}` : ''}`
  return new Request(url, {
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

function mockMembership(hasMembership: boolean) {
  // checkOrgMembership calls: from('organization_members').select('role').eq(...).eq(...).single()
  const singleMock = vi.fn().mockResolvedValue({
    data: hasMembership ? { role: 'owner' } : null,
    error: hasMembership ? null : { message: 'Not found' },
  })
  const eqMock2 = vi.fn().mockReturnValue({ single: singleMock })
  const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 })

  return { select: selectMock, eq: eqMock1 }
}

describe('Prompts API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/organizations/[orgId]/prompts', () => {
    it('creates a prompt for authenticated member', async () => {
      mockAuthenticated()

      const mockPrompt = {
        id: 'prompt-123',
        title: 'Test Prompt',
        prompt_text: 'What is the best CRM?',
        organization_id: TEST_ORG_ID,
        created_by: TEST_USER_ID,
      }

      const membershipMock = mockMembership(true)
      const promptInsertMock = vi.fn().mockReturnThis()
      const promptSelectMock = vi.fn().mockReturnThis()
      const promptSingleMock = vi.fn().mockResolvedValue({ data: mockPrompt, error: null })
      promptInsertMock.mockReturnValue({ select: promptSelectMock })
      promptSelectMock.mockReturnValue({ single: promptSingleMock })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompts') return { insert: promptInsertMock }
        if (table === 'prompt_tags') return { insert: vi.fn().mockResolvedValue({ error: null }) }
        return {}
      })

      const request = createRequest('POST', {
        title: 'Test Prompt',
        prompt_text: 'What is the best CRM?',
      })

      const response = await POST(request, { params: Promise.resolve({ orgId: TEST_ORG_ID }) })
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.id).toBe('prompt-123')
      expect(json.title).toBe('Test Prompt')
    })

    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticated()

      const request = createRequest('POST', {
        title: 'Test Prompt',
        prompt_text: 'What is the best CRM?',
      })

      const response = await POST(request, { params: Promise.resolve({ orgId: TEST_ORG_ID }) })
      expect(response.status).toBe(401)
    })

    it('returns 403 when user is not a member', async () => {
      mockAuthenticated()

      const membershipMock = mockMembership(false)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        return {}
      })

      const request = createRequest('POST', {
        title: 'Test Prompt',
        prompt_text: 'What is the best CRM?',
      })

      const response = await POST(request, { params: Promise.resolve({ orgId: TEST_ORG_ID }) })
      expect(response.status).toBe(403)
    })

    it('returns 400 for invalid body', async () => {
      mockAuthenticated()

      const membershipMock = mockMembership(true)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        return {}
      })

      const request = createRequest('POST', {
        title: '',
        prompt_text: '',
      })

      const response = await POST(request, { params: Promise.resolve({ orgId: TEST_ORG_ID }) })
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/organizations/[orgId]/prompts', () => {
    it('lists prompts for authenticated member', async () => {
      mockAuthenticated()

      const mockPrompts = [
        { id: 'p1', title: 'Prompt 1', prompt_text: 'Question 1' },
        { id: 'p2', title: 'Prompt 2', prompt_text: 'Question 2' },
      ]

      const membershipMock = mockMembership(true)

      // Build chained query mock: from('prompts').select(...).eq(...).order(...)
      const resolvedMock = vi.fn().mockResolvedValue({ data: mockPrompts, error: null })
      const orderMock = vi.fn().mockImplementation(() => resolvedMock())
      const eqMock = vi.fn().mockReturnValue({ order: orderMock, eq: vi.fn().mockReturnValue({ order: orderMock }), then: resolvedMock().then?.bind(resolvedMock()) })

      // The query is used as a thenable (awaited), so we need the chain to resolve
      const chainResult = { data: mockPrompts, error: null }
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(chainResult),
            then: (resolve: (v: unknown) => void) => Promise.resolve(chainResult).then(resolve),
          }),
          then: (resolve: (v: unknown) => void) => Promise.resolve(chainResult).then(resolve),
        }),
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompts') return { select: selectMock }
        return {}
      })

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ orgId: TEST_ORG_ID }) })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toEqual(mockPrompts)
    })

    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticated()

      const request = createRequest('GET')
      const response = await GET(request, { params: Promise.resolve({ orgId: TEST_ORG_ID }) })
      expect(response.status).toBe(401)
    })
  })
})
