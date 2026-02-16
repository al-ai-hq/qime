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

vi.mock('@/lib/ai', () => ({
  getProvider: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({
      text: 'Test response mentioning BrandName as a top choice for CRM solutions. BrandName is recommended.',
      citedUrls: [{ url: 'https://example.com', title: 'Test Source' }],
      durationMs: 150,
    }),
  })),
}))

vi.mock('@/lib/metrics/compute', () => ({
  computeMetrics: vi.fn(() => ({
    brand_mentioned: true,
    brand_mention_count: 2,
    brand_sentiment: 'neutral',
    brand_cited: false,
    mentioned_competitors: [],
    organization_position: null,
    competitor_mentions: {},
    cited_urls: [{ url: 'https://example.com', title: 'Test Source' }],
    response_length: 95,
    visibility_score: 75,
  })),
}))

vi.mock('@/lib/scheduling/utils', () => ({
  getEffectiveFrequency: vi.fn(() => ({ frequency: 'daily', minHours: 24 })),
  calculateNextRunAt: vi.fn(() => new Date('2026-02-17T00:00:00Z')),
}))

import { POST } from '@/app/api/organizations/[orgId]/prompts/[promptId]/run/route'

const TEST_ORG_ID = 'test-org-id'
const TEST_PROMPT_ID = 'test-prompt-id'
const TEST_USER_ID = 'test-user-id'

const mockUser = {
  id: TEST_USER_ID,
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

function createRequest() {
  return new Request(`http://localhost:3000/api/organizations/${TEST_ORG_ID}/prompts/${TEST_PROMPT_ID}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const singleMock = vi.fn().mockResolvedValue({
    data: hasMembership ? { role: 'owner' } : null,
    error: hasMembership ? null : { message: 'Not found' },
  })
  const eqMock2 = vi.fn().mockReturnValue({ single: singleMock })
  const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 })

  return { select: selectMock }
}

function createParams() {
  return { params: Promise.resolve({ orgId: TEST_ORG_ID, promptId: TEST_PROMPT_ID }) }
}

describe('Prompt Runs API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/organizations/[orgId]/prompts/[promptId]/run', () => {
    it('triggers a run on all org platforms and returns results', async () => {
      mockAuthenticated()

      const mockPrompt = {
        id: TEST_PROMPT_ID,
        prompt_text: 'What is the best CRM?',
        organization_id: TEST_ORG_ID,
      }

      const mockOrg = {
        id: TEST_ORG_ID,
        name: 'BrandName',
        website: 'https://brandname.com',
        run_frequency: 'daily',
        min_hours_between_runs: 24,
      }

      const mockRun = {
        id: 'run-1',
        prompt_id: TEST_PROMPT_ID,
        platform_id: 'chatgpt',
        response_text: 'Test response',
        visibility_score: 75,
      }

      const membershipMock = mockMembership(true)

      // Build chained query helpers
      function chainedSelectSingle(resolvedData: unknown, error: unknown = null) {
        const singleMock = vi.fn().mockResolvedValue({ data: resolvedData, error })
        const eqMock = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: singleMock }),
          single: singleMock,
        })
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
        return { select: selectMock }
      }

      function chainedInsertSelectSingle(resolvedData: unknown) {
        const singleMock = vi.fn().mockResolvedValue({ data: resolvedData, error: null })
        const selectMock = vi.fn().mockReturnValue({ single: singleMock })
        const insertMock = vi.fn().mockReturnValue({ select: selectMock })
        return { insert: insertMock }
      }

      function chainedUpdate() {
        const eqMock2 = vi.fn().mockResolvedValue({ error: null })
        const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 })
        const updateMock = vi.fn().mockReturnValue({ eq: eqMock1 })
        return { update: updateMock }
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompts') return chainedSelectSingle(mockPrompt)
        if (table === 'organizations') return chainedSelectSingle(mockOrg)
        if (table === 'competitors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        if (table === 'organization_platforms') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ platform_id: 'chatgpt' }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'prompt_runs') return chainedInsertSelectSingle(mockRun)
        if (table === 'prompt_schedules') return chainedUpdate()
        return {}
      })

      const response = await POST(createRequest(), createParams())
      const json = await response.json()

      expect(response.status).toBe(201)
      expect(json.runs).toHaveLength(1)
      expect(json.runs[0]).toEqual(mockRun)
    })

    it('returns 404 if prompt not found', async () => {
      mockAuthenticated()

      const membershipMock = mockMembership(true)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompts') {
          const singleMock = vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          })
          const eqMock = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: singleMock }),
          })
          const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
          return { select: selectMock }
        }
        return {}
      })

      const response = await POST(createRequest(), createParams())
      expect(response.status).toBe(404)

      const json = await response.json()
      expect(json.error).toBe('Prompt not found')
    })

    it('returns 400 if no platforms configured', async () => {
      mockAuthenticated()

      const mockPrompt = {
        id: TEST_PROMPT_ID,
        prompt_text: 'What is the best CRM?',
        organization_id: TEST_ORG_ID,
      }

      const mockOrg = {
        id: TEST_ORG_ID,
        name: 'BrandName',
        website: 'https://brandname.com',
      }

      const membershipMock = mockMembership(true)

      function chainedSelectSingle(resolvedData: unknown) {
        const singleMock = vi.fn().mockResolvedValue({ data: resolvedData, error: null })
        const eqMock = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: singleMock }),
          single: singleMock,
        })
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
        return { select: selectMock }
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompts') return chainedSelectSingle(mockPrompt)
        if (table === 'organizations') return chainedSelectSingle(mockOrg)
        if (table === 'competitors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        if (table === 'organization_platforms') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        return {}
      })

      const response = await POST(createRequest(), createParams())
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error).toContain('No platforms configured')
    })

    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticated()

      const response = await POST(createRequest(), createParams())
      expect(response.status).toBe(401)
    })

    it('returns 403 when user is not a member', async () => {
      mockAuthenticated()

      const membershipMock = mockMembership(false)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        return {}
      })

      const response = await POST(createRequest(), createParams())
      expect(response.status).toBe(403)
    })
  })
})
