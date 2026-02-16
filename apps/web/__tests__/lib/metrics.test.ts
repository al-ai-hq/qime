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
    { id: 'comp-1', name: 'Rival Inc' },
    { id: 'comp-2', name: 'Contender Co' },
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

  describe('sentiment analysis', () => {
    it('returns positive when positive words appear near brand', () => {
      const result = computeMetrics(
        makeResponse('Acme is the best and most innovative solution available'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.brand_sentiment).toBe('positive')
    })

    it('returns negative when negative words appear near brand', () => {
      const result = computeMetrics(
        makeResponse('Acme is the worst and most disappointing product'),
        brand,
        brandWebsite,
        competitors
      )
      expect(result.brand_sentiment).toBe('negative')
    })

    it('returns neutral when no sentiment words appear near brand', () => {
      const result = computeMetrics(
        makeResponse('Acme offers a product in this category'),
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

    it('returns higher score for positive sentiment than negative', () => {
      const positive = computeMetrics(
        makeResponse('Acme is the best and most recommended choice'),
        brand,
        brandWebsite,
        competitors
      )
      const negative = computeMetrics(
        makeResponse('Acme is the worst and most disappointing option'),
        brand,
        brandWebsite,
        competitors
      )
      expect(positive.visibility_score).toBeGreaterThan(negative.visibility_score)
    })

    it('returns higher score when brand URL is cited', () => {
      const withUrl = computeMetrics(
        makeResponse('Acme is here'),
        brand,
        brandWebsite,
        [{ id: 'comp-1', name: 'Rival Inc' }]
      )
      // Override citedUrls to include brand URL
      const withBrandUrl = computeMetrics(
        { text: 'Acme is here', citedUrls: [{ url: 'https://acme.com/page' }], durationMs: 100 },
        brand,
        brandWebsite,
        [{ id: 'comp-1', name: 'Rival Inc' }]
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

  describe('empty response handling', () => {
    it('handles empty text', () => {
      const result = computeMetrics(makeResponse(''), brand, brandWebsite, competitors)
      expect(result.brand_mentioned).toBe(false)
      expect(result.brand_mention_count).toBe(0)
      expect(result.brand_sentiment).toBeNull()
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
