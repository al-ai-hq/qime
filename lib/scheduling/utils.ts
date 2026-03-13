type RunFrequency = 'daily' | 'twice_daily' | 'weekly' | 'every_other_day'

const FREQUENCY_HOURS: Record<RunFrequency, number> = {
  daily: 24,
  twice_daily: 12,
  weekly: 168,
  every_other_day: 48,
}

export function calculateNextRunAt(
  frequency: RunFrequency,
  minHoursBetweenRuns: number,
  lastRunAt?: Date | null
): Date {
  const now = new Date()
  const baseHours = FREQUENCY_HOURS[frequency] ?? 24
  const hours = Math.max(baseHours, minHoursBetweenRuns)

  if (!lastRunAt) return now

  const nextRun = new Date(lastRunAt.getTime() + hours * 60 * 60 * 1000)
  return nextRun > now ? nextRun : now
}

export function getEffectiveFrequency(
  orgFrequency: RunFrequency,
  orgMinHours: number,
  promptFrequencyOverride?: RunFrequency | null,
  promptMinHoursOverride?: number | null
): { frequency: RunFrequency; minHours: number } {
  return {
    frequency: promptFrequencyOverride ?? orgFrequency,
    minHours: promptMinHoursOverride ?? orgMinHours,
  }
}

export function isDue(nextRunAt: Date): boolean {
  return new Date() >= nextRunAt
}
