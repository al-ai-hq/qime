import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateNextRunAt, getEffectiveFrequency, isDue } from '@/lib/scheduling/utils'

describe('calculateNextRunAt', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns now when no lastRunAt is provided', () => {
    const result = calculateNextRunAt('daily', 24)
    expect(result.getTime()).toBe(new Date('2026-02-16T12:00:00Z').getTime())
  })

  it('returns now when lastRunAt is null', () => {
    const result = calculateNextRunAt('daily', 24, null)
    expect(result.getTime()).toBe(new Date('2026-02-16T12:00:00Z').getTime())
  })

  it('returns future date based on daily frequency', () => {
    const lastRun = new Date('2026-02-16T10:00:00Z')
    const result = calculateNextRunAt('daily', 24, lastRun)
    // 24 hours after lastRun = 2026-02-17T10:00:00Z, which is in the future
    expect(result.getTime()).toBe(new Date('2026-02-17T10:00:00Z').getTime())
  })

  it('returns future date based on weekly frequency', () => {
    const lastRun = new Date('2026-02-16T10:00:00Z')
    const result = calculateNextRunAt('weekly', 24, lastRun)
    // 168 hours after lastRun
    expect(result.getTime()).toBe(new Date('2026-02-23T10:00:00Z').getTime())
  })

  it('returns now when the computed next run is in the past', () => {
    const lastRun = new Date('2026-02-14T12:00:00Z')
    const result = calculateNextRunAt('daily', 24, lastRun)
    // 24 hours after Feb 14 12:00 = Feb 15 12:00, which is in the past relative to now (Feb 16 12:00)
    expect(result.getTime()).toBe(new Date('2026-02-16T12:00:00Z').getTime())
  })

  it('respects minHours when it exceeds frequency hours', () => {
    const lastRun = new Date('2026-02-16T10:00:00Z')
    // twice_daily = 12 hours, but minHours = 48
    const result = calculateNextRunAt('twice_daily', 48, lastRun)
    // Should use 48 hours (the larger value)
    expect(result.getTime()).toBe(new Date('2026-02-18T10:00:00Z').getTime())
  })

  it('uses frequency hours when they exceed minHours', () => {
    const lastRun = new Date('2026-02-16T10:00:00Z')
    // weekly = 168 hours, minHours = 24
    const result = calculateNextRunAt('weekly', 24, lastRun)
    expect(result.getTime()).toBe(new Date('2026-02-23T10:00:00Z').getTime())
  })
})

describe('getEffectiveFrequency', () => {
  it('returns org values when no override is provided', () => {
    const result = getEffectiveFrequency('daily', 24)
    expect(result).toEqual({ frequency: 'daily', minHours: 24 })
  })

  it('returns org values when overrides are null', () => {
    const result = getEffectiveFrequency('daily', 24, null, null)
    expect(result).toEqual({ frequency: 'daily', minHours: 24 })
  })

  it('returns override frequency when provided', () => {
    const result = getEffectiveFrequency('daily', 24, 'weekly', null)
    expect(result).toEqual({ frequency: 'weekly', minHours: 24 })
  })

  it('returns override minHours when provided', () => {
    const result = getEffectiveFrequency('daily', 24, null, 48)
    expect(result).toEqual({ frequency: 'daily', minHours: 48 })
  })

  it('returns both overrides when provided', () => {
    const result = getEffectiveFrequency('daily', 24, 'twice_daily', 6)
    expect(result).toEqual({ frequency: 'twice_daily', minHours: 6 })
  })
})

describe('isDue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when date is in the past', () => {
    expect(isDue(new Date('2026-02-15T12:00:00Z'))).toBe(true)
  })

  it('returns true when date is exactly now', () => {
    expect(isDue(new Date('2026-02-16T12:00:00Z'))).toBe(true)
  })

  it('returns false when date is in the future', () => {
    expect(isDue(new Date('2026-02-17T12:00:00Z'))).toBe(false)
  })
})
