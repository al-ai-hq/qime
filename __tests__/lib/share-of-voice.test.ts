import { describe, it, expect } from 'vitest'
import { computeShareOfVoice } from '@/lib/metrics/share-of-voice'

describe('computeShareOfVoice', () => {
  it('returns empty result for no runs', () => {
    const result = computeShareOfVoice([], [])
    expect(result).toEqual({ brand_share: 0, competitor_shares: {}, competitor_names: {}, total_mentions: 0 })
  })

  it('returns 100% brand share when no competitors mentioned', () => {
    const runs = [
      { brand_mention_count: 5, competitor_mentions: {} },
      { brand_mention_count: 3, competitor_mentions: {} },
    ]
    const result = computeShareOfVoice(runs, [])
    expect(result.brand_share).toBe(1)
    expect(result.total_mentions).toBe(8)
  })

  it('returns 0% brand share when brand never mentioned', () => {
    const runs = [
      { brand_mention_count: 0, competitor_mentions: { 'comp-1': 4 } },
    ]
    const competitors = [{ id: 'comp-1', name: 'Rival Inc' }]
    const result = computeShareOfVoice(runs, competitors)
    expect(result.brand_share).toBe(0)
    expect(result.competitor_shares['comp-1']).toBe(1)
  })

  it('calculates correct proportions with brand and competitors', () => {
    const runs = [
      { brand_mention_count: 3, competitor_mentions: { 'comp-1': 2, 'comp-2': 1 } },
      { brand_mention_count: 2, competitor_mentions: { 'comp-1': 3 } },
    ]
    const competitors = [
      { id: 'comp-1', name: 'Rival Inc' },
      { id: 'comp-2', name: 'Contender Co' },
    ]
    const result = computeShareOfVoice(runs, competitors)
    // Total: brand=5, comp-1=5, comp-2=1 => total=11
    expect(result.brand_share).toBeCloseTo(5 / 11)
    expect(result.competitor_shares['comp-1']).toBeCloseTo(5 / 11)
    expect(result.competitor_shares['comp-2']).toBeCloseTo(1 / 11)
    expect(result.total_mentions).toBe(11)
  })

  it('returns 0 for all when total mentions is zero', () => {
    const runs = [
      { brand_mention_count: 0, competitor_mentions: {} },
    ]
    const result = computeShareOfVoice(runs, [])
    expect(result.brand_share).toBe(0)
    expect(result.total_mentions).toBe(0)
  })

  it('includes competitor names in result', () => {
    const runs = [
      { brand_mention_count: 2, competitor_mentions: { 'comp-1': 3 } },
    ]
    const competitors = [
      { id: 'comp-1', name: 'Rival Inc' },
      { id: 'comp-2', name: 'Contender Co' },
    ]
    const result = computeShareOfVoice(runs, competitors)
    expect(result.competitor_names).toEqual({ 'comp-1': 'Rival Inc', 'comp-2': 'Contender Co' })
  })
})
