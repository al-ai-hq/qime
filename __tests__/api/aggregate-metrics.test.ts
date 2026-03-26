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

import { GET } from '@/app/api/organizations/[orgId]/metrics/route'
import { NextRequest } from 'next/server'

const TEST_ORG_ID = 'test-org-id'
const TEST_USER_ID = 'test-user-id'

const mockUser = {
  id: TEST_USER_ID,
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
}

function createRequest(queryParams: Record<string, string> = {}) {
  const url = new URL(`http://localhost:3000/api/organizations/${TEST_ORG_ID}/metrics`)
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url)
}

function createParams() {
  return { params: Promise.resolve({ orgId: TEST_ORG_ID }) }
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

function mockCompetitors(competitors: { id: string; name: string }[] = []) {
  const eqMock = vi.fn().mockResolvedValue({ data: competitors, error: null })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  return { select: selectMock }
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

describe('Aggregate Metrics API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/organizations/[orgId]/metrics', () => {
    it('returns 401 when unauthenticated', async () => {
      mockUnauthenticated()
      const response = await GET(createRequest(), createParams())
      expect(response.status).toBe(401)
    })

    it('returns 403 when user is not a member', async () => {
      mockAuthenticated()
      const membershipMock = mockMembership(false)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        return {}
      })
      const response = await GET(createRequest(), createParams())
      expect(response.status).toBe(403)
    })

    it('returns metrics with no filters', async () => {
      mockAuthenticated()
      const membershipMock = mockMembership(true)

      const runsData = [
        { brand_mentioned: true, brand_cited: true, brand_sentiment: 'neutral' },
        { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' },
        { brand_mentioned: false, brand_cited: false, brand_sentiment: null },
      ]

      // Mock chain for prompt_runs: select().eq().gte/lte/in -> resolves data
      const resolvedResult = { data: runsData, error: null }
      const chainObj = {
        eq: vi.fn().mockReturnValue(resolvedResult),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: resolvedResult.then,
      }
      // Make chainObj thenable so await works
      Object.defineProperty(chainObj, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(resolvedResult),
      })
      const selectMock = vi.fn().mockReturnValue(chainObj)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompt_runs') return { select: selectMock }
        if (table === 'competitors') return mockCompetitors()
        return {}
      })

      const response = await GET(createRequest(), createParams())
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics).toBeDefined()
      expect(json.metrics.total_runs).toBe(3)
      expect(json.metrics.mention_frequency).toBeCloseTo(2 / 3)
      expect(json.metrics.citation_frequency).toBeCloseTo(1 / 3)
    })

    it('filters by date range', async () => {
      mockAuthenticated()
      const membershipMock = mockMembership(true)

      const runsData = [
        { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' },
      ]

      const resolvedResult = { data: runsData, error: null }
      const chainObj = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnValue(resolvedResult),
        in: vi.fn().mockReturnThis(),
      }
      Object.defineProperty(chainObj, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(resolvedResult),
        configurable: true,
      })
      // Make eq return chainObj for chaining
      chainObj.eq.mockReturnValue(chainObj)
      const selectMock = vi.fn().mockReturnValue(chainObj)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompt_runs') return { select: selectMock }
        if (table === 'competitors') return mockCompetitors()
        return {}
      })

      const response = await GET(
        createRequest({ start_date: '2026-01-01', end_date: '2026-01-31' }),
        createParams()
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics.total_runs).toBe(1)
    })

    it('filters by platform_id', async () => {
      mockAuthenticated()
      const membershipMock = mockMembership(true)

      const runsData = [
        { brand_mentioned: true, brand_cited: true, brand_sentiment: 'neutral' },
      ]

      const resolvedResult = { data: runsData, error: null }
      const chainObj = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnValue(resolvedResult),
      }
      Object.defineProperty(chainObj, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(resolvedResult),
        configurable: true,
      })
      chainObj.eq.mockReturnValue(chainObj)
      const selectMock = vi.fn().mockReturnValue(chainObj)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompt_runs') return { select: selectMock }
        if (table === 'competitors') return mockCompetitors()
        return {}
      })

      const response = await GET(
        createRequest({ platform_id: 'chatgpt,gemini' }),
        createParams()
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics.total_runs).toBe(1)
    })

    it('returns zeros when no matching runs', async () => {
      mockAuthenticated()
      const membershipMock = mockMembership(true)

      const resolvedResult = { data: [], error: null }
      const chainObj = {
        eq: vi.fn().mockReturnValue(resolvedResult),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      }
      Object.defineProperty(chainObj, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(resolvedResult),
      })
      const selectMock = vi.fn().mockReturnValue(chainObj)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompt_runs') return { select: selectMock }
        if (table === 'competitors') return mockCompetitors()
        return {}
      })

      const response = await GET(createRequest(), createParams())
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics.total_runs).toBe(0)
      expect(json.metrics.mention_frequency).toBe(0)
      expect(json.metrics.citation_frequency).toBe(0)
      expect(json.metrics.sentiment_score).toBe(0)
      expect(json.metrics.visibility_score).toBe(0)
    })

    it('filters by tag_id', async () => {
      mockAuthenticated()
      const membershipMock = mockMembership(true)

      // Mock prompt_tags query
      const taggedPrompts = [{ prompt_id: 'prompt-1' }, { prompt_id: 'prompt-2' }]
      const tagSelectMock = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: taggedPrompts, error: null }),
      })

      // Mock prompts query
      const matchingPrompts = [{ id: 'prompt-1' }]
      const promptInMock = vi.fn().mockResolvedValue({ data: matchingPrompts, error: null })
      const promptEqMock = vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ in: promptInMock }) })
      const promptSelectMock = vi.fn().mockReturnValue({ eq: promptEqMock })

      // Mock prompt_runs query
      const runsData = [
        { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' },
      ]
      const resolvedResult = { data: runsData, error: null }
      const runChainObj = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnValue(resolvedResult),
      }
      Object.defineProperty(runChainObj, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(resolvedResult),
        configurable: true,
      })
      runChainObj.eq.mockReturnValue(runChainObj)
      const runSelectMock = vi.fn().mockReturnValue(runChainObj)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompt_tags') return { select: tagSelectMock }
        if (table === 'prompts') return { select: promptSelectMock }
        if (table === 'prompt_runs') return { select: runSelectMock }
        if (table === 'competitors') return mockCompetitors()
        return {}
      })

      const response = await GET(
        createRequest({ tag_id: 'tag-1' }),
        createParams()
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics).toBeDefined()
    })

    it('filters by topic_id', async () => {
      mockAuthenticated()
      const membershipMock = mockMembership(true)

      // Mock prompts query with topic filter
      const matchingPrompts = [{ id: 'prompt-1' }]
      const promptInMock = vi.fn().mockResolvedValue({ data: matchingPrompts, error: null })
      const promptEqMock = vi.fn().mockReturnValue({ in: promptInMock })
      const promptSelectMock = vi.fn().mockReturnValue({ eq: promptEqMock })

      // Mock prompt_runs query
      const runsData = [
        { brand_mentioned: true, brand_cited: true, brand_sentiment: 'neutral' },
      ]
      const resolvedResult = { data: runsData, error: null }
      const runChainObj = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnValue(resolvedResult),
      }
      Object.defineProperty(runChainObj, 'then', {
        value: (resolve: (v: unknown) => void) => resolve(resolvedResult),
        configurable: true,
      })
      runChainObj.eq.mockReturnValue(runChainObj)
      const runSelectMock = vi.fn().mockReturnValue(runChainObj)

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return membershipMock
        if (table === 'prompts') return { select: promptSelectMock }
        if (table === 'prompt_runs') return { select: runSelectMock }
        if (table === 'competitors') return mockCompetitors()
        return {}
      })

      const response = await GET(
        createRequest({ topic_id: 'topic-1' }),
        createParams()
      )
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.metrics).toBeDefined()
    })
  })
})
