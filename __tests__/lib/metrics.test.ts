import { describe, it, expect } from 'vitest'
import { computeMetrics } from '@/lib/metrics/compute'
import type { AIProviderResponse } from '@/lib/ai/types'

function makeResponse(text: string, citedUrls: { url: string; title?: string }[] = []): AIProviderResponse {
  return { text, citedUrls, durationMs: 100 }
}

describe('computeMetrics', () => {
  const brand = 'Acme'
  const brandWebsite = 'https://acme.com'
  const competitors = [
    { id: 'comp-1', name: 'Rival Inc', website: 'https://rivalinc.com' },
    { id: 'comp-2', name: 'Contender Co', website: null },
  ]

  describe('brand mention detection', () => {
    it('detects brand mentioned (case insensitive)', () => {
      const result = computeMetrics(makeResponse('ACME is a great company'), brand, brandWebsite, competitors)
      expect(result.brand_mentioned).toBe(true)
    })

    it('detects brand mentioned with mixed case', () => {
      const result = computeMetrics(makeResponse('Check out acMe for more'), brand, brandWebsite, competitors)
      expect(result.brand_mentioned).toBe(true)
    })

    it('returns false when brand is not mentioned', () => {
      const result = computeMetrics(makeResponse('No relevant companies here'), brand, brandWebsite, competitors)
      expect(result.brand_mentioned).toBe(false)
    })
  })

  describe('brand mention count', () => {
    it('counts single mention', () => {
      const result = computeMetrics(makeResponse('Acme is good'), brand, brandWebsite, competitors)
      expect(result.brand_mention_count).toBe(1)
    })

    it('counts multiple mentions', () => {
      const result = computeMetrics(makeResponse('Acme is great. Acme does well. Use Acme today.'), brand, brandWebsite, competitors)
      expect(result.brand_mention_count).toBe(3)
    })

    it('returns zero when brand is absent', () => {
      const result = computeMetrics(makeResponse('Nothing here'), brand, brandWebsite, competitors)
      expect(result.brand_mention_count).toBe(0)
    })
  })

  describe('brand sentiment', () => {
    it('returns neutral when brand is mentioned', () => {
      const result = computeMetrics(
        makeResponse('Acme is the best and most innovative solution available'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.brand_sentiment).toBe('neutral')
    })

    it('always returns neutral regardless of surrounding words', () => {
      const result = computeMetrics(
        makeResponse('Acme is the worst and most disappointing product'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.brand_sentiment).toBe('neutral')
    })

    it('returns null when brand is not mentioned', () => {
      const result = computeMetrics(makeResponse('Some unrelated text'), brand, brandWebsite, competitors)
      expect(result.brand_sentiment).toBeNull()
    })
  })

  describe('brand_cited', () => {
    it('returns true when brand domain appears in cited URLs', () => {
      const result = computeMetrics(
        makeResponse('Acme is here', [{ url: 'https://acme.com/page', title: 'Acme Page' }]),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.brand_cited).toBe(true)
    })

    it('returns false when brand domain is not in cited URLs', () => {
      const result = computeMetrics(
        makeResponse('Acme is here', [{ url: 'https://other.com/page' }]),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.brand_cited).toBe(false)
    })

    it('returns false when no cited URLs', () => {
      const result = computeMetrics(makeResponse('Acme is here'), brand, brandWebsite, competitors)
      expect(result.brand_cited).toBe(false)
    })

    it('returns false when brandWebsite is null', () => {
      const result = computeMetrics(
        makeResponse('Acme is here', [{ url: 'https://acme.com/page' }]),
        brand,
        null,
        competitors
      )
      expect(result.brand_cited).toBe(false)
    })
  })

  describe('mentioned_competitors', () => {
    it('returns competitors ordered by first appearance', () => {
      const result = computeMetrics(
        makeResponse('First Contender Co appears, then Rival Inc shows up'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.mentioned_competitors).toEqual(['Contender Co', 'Rival Inc'])
    })

    it('returns empty array when no competitors mentioned', () => {
      const result = computeMetrics(makeResponse('Acme is standalone'), brand, brandWebsite, competitors)
      expect(result.mentioned_competitors).toEqual([])
    })

    it('only includes competitors that appear in text', () => {
      const result = computeMetrics(
        makeResponse('Only Rival Inc is here'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.mentioned_competitors).toEqual(['Rival Inc'])
    })
  })

  describe('organization_position', () => {
    it('returns 1.0 when brand is mentioned first among multiple companies', () => {
      const result = computeMetrics(
        makeResponse('Acme leads the market. Rival Inc follows.'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.organization_position).toBe(1.0)
    })

    it('returns 0.25 when brand is mentioned last among multiple companies', () => {
      const result = computeMetrics(
        makeResponse('Rival Inc leads. Contender Co follows. Acme is also there.'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.organization_position).toBe(0.25)
    })

    it('returns interpolated value when brand is in the middle', () => {
      const result = computeMetrics(
        makeResponse('Rival Inc is first. Acme is second. Contender Co is third.'),
        brand,
        brandWebsite,
        competitors
      )
      // rank=1, n=3: 1.0 - 0.75 * (1/2) = 0.625
      expect(result.organization_position).toBe(0.625)
    })

    it('returns null when fewer than 2 companies mentioned', () => {
      const result = computeMetrics(
        makeResponse('Acme is the only one'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.organization_position).toBeNull()
    })

    it('returns null when brand is not mentioned', () => {
      const result = computeMetrics(
        makeResponse('Rival Inc and Contender Co are here'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.organization_position).toBeNull()
    })
  })

  describe('competitor mention counting', () => {
    it('counts competitor mentions', () => {
      const result = computeMetrics(
        makeResponse('Rival Inc is a competitor. Rival Inc appears twice.'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.competitor_mentions['comp-1']).toBe(2)
    })

    it('counts multiple competitors', () => {
      const result = computeMetrics(
        makeResponse('Rival Inc and Contender Co are both competitors'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.competitor_mentions['comp-1']).toBe(1)
      expect(result.competitor_mentions['comp-2']).toBe(1)
    })

    it('omits competitors with zero mentions', () => {
      const result = computeMetrics(
        makeResponse('Only Rival Inc is here'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.competitor_mentions['comp-1']).toBe(1)
      expect(result.competitor_mentions['comp-2']).toBeUndefined()
    })
  })

  describe('visibility score calculation', () => {
    it('returns higher score when brand is mentioned', () => {
      const mentioned = computeMetrics(makeResponse('Acme is here'), brand, brandWebsite, competitors)
      const notMentioned = computeMetrics(makeResponse('Nothing here'), brand, brandWebsite, competitors)
      expect(mentioned.visibility_score).toBeGreaterThan(notMentioned.visibility_score)
    })

    it('returns higher score when brand URL is cited', () => {
      const withUrl = computeMetrics(
        makeResponse('Acme is here'),
        brand,
        brandWebsite,
        [{ id: 'comp-1', name: 'Rival Inc', website: null }]
      )
      const withBrandUrl = computeMetrics(
        { text: 'Acme is here', citedUrls: [{ url: 'https://acme.com/page' }], durationMs: 100 },
        brand,
        brandWebsite,
        [{ id: 'comp-1', name: 'Rival Inc', website: null }]
      )
      expect(withBrandUrl.visibility_score).toBeGreaterThan(withUrl.visibility_score)
    })

    it('returns a score between 0 and 100', () => {
      const result = computeMetrics(
        makeResponse('Acme is the best leading top excellent recommended innovative outstanding reliable great superior choice'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.visibility_score).toBeGreaterThanOrEqual(0)
      expect(result.visibility_score).toBeLessThanOrEqual(100)
    })
  })

  describe('alternate name detection', () => {
    const competitorsWithAltNames = [
      { id: 'comp-1', name: 'Rival Inc', alternate_names: ['ライバル社'], website: 'https://rivalinc.com' },
      { id: 'comp-2', name: 'Contender Co', alternate_names: ['컨텐더'], website: null },
    ]

    it('detects brand via alternate name', () => {
      const result = computeMetrics(
        makeResponse('삼성은 좋은 회사입니다'),
        'Samsung',
        brandWebsite,
        competitors,
        ['삼성']
      )
      expect(result.brand_mentioned).toBe(true)
      expect(result.brand_mention_count).toBe(1)
    })

    it('aggregates brand mention count across primary and alternate names', () => {
      const result = computeMetrics(
        makeResponse('Samsung is great. 삼성은 최고입니다.'),
        'Samsung',
        brandWebsite,
        competitors,
        ['삼성']
      )
      expect(result.brand_mentioned).toBe(true)
      expect(result.brand_mention_count).toBe(2)
    })

    it('detects competitor via alternate name', () => {
      const result = computeMetrics(
        makeResponse('ライバル社は競合です'),
        brand,
        brandWebsite,
        competitorsWithAltNames
      )
      expect(result.competitor_mentions['comp-1']).toBe(1)
    })

    it('aggregates competitor mentions across primary and alternate names', () => {
      const result = computeMetrics(
        makeResponse('Rival Inc is a competitor. ライバル社も競合です.'),
        brand,
        brandWebsite,
        competitorsWithAltNames
      )
      expect(result.competitor_mentions['comp-1']).toBe(2)
    })

    it('orders mentioned competitors by earliest name variant appearance', () => {
      const result = computeMetrics(
        makeResponse('First 컨텐더 appears, then Rival Inc shows up'),
        brand,
        brandWebsite,
        competitorsWithAltNames
      )
      expect(result.mentioned_competitors).toEqual(['Contender Co', 'Rival Inc'])
    })

    it('uses alternate name for organization position when it appears first', () => {
      const result = computeMetrics(
        makeResponse('삼성 leads the market. Rival Inc follows.'),
        'Samsung',
        brandWebsite,
        competitorsWithAltNames,
        ['삼성']
      )
      expect(result.organization_position).toBe(1.0)
    })

    it('works with empty alternate names (backward compatibility)', () => {
      const result = computeMetrics(
        makeResponse('Acme is great'),
        brand,
        brandWebsite,
        competitors,
        []
      )
      expect(result.brand_mentioned).toBe(true)
      expect(result.brand_mention_count).toBe(1)
    })

    it('works without alternate names parameter (backward compatibility)', () => {
      const result = computeMetrics(
        makeResponse('Acme is great'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.brand_mentioned).toBe(true)
    })

    it('deduplicates brand name variants', () => {
      const result = computeMetrics(
        makeResponse('Samsung is great'),
        'Samsung',
        brandWebsite,
        competitors,
        ['Samsung', 'samsung']
      )
      // Should count "samsung" once, not multiple times due to duplicates
      expect(result.brand_mention_count).toBe(1)
    })
  })

  describe('empty response handling', () => {
    it('handles empty text', () => {
      const result = computeMetrics(makeResponse(''), brand, brandWebsite, competitors)
      expect(result.brand_mentioned).toBe(false)
      expect(result.brand_mention_count).toBe(0)
      expect(result.brand_sentiment).toBeNull()
      expect(result.brand_cited).toBe(false)
      expect(result.mentioned_competitors).toEqual([])
      expect(result.organization_position).toBeNull()
      expect(result.competitor_mentions).toEqual({})
      expect(result.response_length).toBe(0)
      expect(result.visibility_score).toBeGreaterThanOrEqual(0)
    })

    it('handles empty cited URLs', () => {
      const result = computeMetrics(makeResponse('Acme is mentioned', []), brand, brandWebsite, competitors)
      expect(result.cited_urls).toEqual([])
    })
  })
})
