import { describe, it, expect } from 'vitest'
import { computeAggregateMetrics } from '@/lib/metrics/aggregate'

describe('computeAggregateMetrics', () => {
  it('returns all zeros for empty input', () => {
    const result = computeAggregateMetrics([])
    expect(result).toEqual({
      mention_frequency: 0,
      citation_frequency: 0,
      sentiment_score: 0,
      visibility_score: 0,
      total_runs: 0,
    })
  })

  it('calculates correct mention frequency', () => {
    const runs = [
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' as const },
      { brand_mentioned: false, brand_cited: false, brand_sentiment: null },
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' as const },
      { brand_mentioned: false, brand_cited: false, brand_sentiment: null },
    ]
    const result = computeAggregateMetrics(runs)
    expect(result.mention_frequency).toBe(0.5)
  })

  it('calculates correct citation frequency', () => {
    const runs = [
      { brand_mentioned: true, brand_cited: true, brand_sentiment: 'neutral' as const },
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' as const },
      { brand_mentioned: true, brand_cited: true, brand_sentiment: 'neutral' as const },
    ]
    const result = computeAggregateMetrics(runs)
    expect(result.citation_frequency).toBeCloseTo(2 / 3)
  })

  it('calculates correct sentiment averaging', () => {
    const runs = [
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'positive' as const },
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'negative' as const },
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' as const },
    ]
    const result = computeAggregateMetrics(runs)
    // (1.0 + 0.0 + 0.5) / 3 = 0.5
    expect(result.sentiment_score).toBe(0.5)
  })

  it('excludes null sentiments from averaging', () => {
    const runs = [
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'positive' as const },
      { brand_mentioned: false, brand_cited: false, brand_sentiment: null },
    ]
    const result = computeAggregateMetrics(runs)
    // Only 1 sentiment value (positive=1.0)
    expect(result.sentiment_score).toBe(1.0)
  })

  it('calculates correct visibility score weighting', () => {
    const runs = [
      { brand_mentioned: true, brand_cited: true, brand_sentiment: 'positive' as const },
      { brand_mentioned: true, brand_cited: true, brand_sentiment: 'positive' as const },
    ]
    const result = computeAggregateMetrics(runs)
    // mention_frequency = 1.0, citation_frequency = 1.0, sentiment_score = 1.0
    // visibility = 0.5 * 1.0 + 0.3 * 1.0 + 0.2 * 1.0 = 1.0
    expect(result.visibility_score).toBe(1.0)
    expect(result.total_runs).toBe(2)
  })

  it('handles single run correctly', () => {
    const runs = [
      { brand_mentioned: true, brand_cited: false, brand_sentiment: 'neutral' as const },
    ]
    const result = computeAggregateMetrics(runs)
    expect(result.mention_frequency).toBe(1.0)
    expect(result.citation_frequency).toBe(0)
    expect(result.sentiment_score).toBe(0.5)
    // 0.5 * 1.0 + 0.3 * 0 + 0.2 * 0.5 = 0.6
    expect(result.visibility_score).toBe(0.6)
    expect(result.total_runs).toBe(1)
  })

  it('returns zero sentiment score when all sentiments are null', () => {
    const runs = [
      { brand_mentioned: false, brand_cited: false, brand_sentiment: null },
      { brand_mentioned: false, brand_cited: false, brand_sentiment: null },
    ]
    const result = computeAggregateMetrics(runs)
    expect(result.sentiment_score).toBe(0)
  })
})
