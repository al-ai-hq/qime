import type { ShareOfVoice } from '@/lib/types'

interface SoVRunRecord {
  brand_mention_count: number
  competitor_mentions: Record<string, number>
}

interface SoVCompetitor {
  id: string
  name: string
}

export function computeShareOfVoice(
  runs: SoVRunRecord[],
  competitors: SoVCompetitor[]
): ShareOfVoice {
  const competitorNames: Record<string, string> = {}
  for (const c of competitors) {
    competitorNames[c.id] = c.name
  }

  if (runs.length === 0) {
    return { brand_share: 0, competitor_shares: {}, competitor_names: competitorNames, total_mentions: 0 }
  }

  let totalBrand = 0
  const totalByCompetitor: Record<string, number> = {}

  for (const run of runs) {
    totalBrand += run.brand_mention_count ?? 0
    for (const [compId, count] of Object.entries(run.competitor_mentions ?? {})) {
      totalByCompetitor[compId] = (totalByCompetitor[compId] ?? 0) + count
    }
  }

  const totalAll = totalBrand + Object.values(totalByCompetitor).reduce((a, b) => a + b, 0)

  if (totalAll === 0) {
    return { brand_share: 0, competitor_shares: {}, competitor_names: competitorNames, total_mentions: 0 }
  }

  const competitorShares: Record<string, number> = {}
  for (const [compId, count] of Object.entries(totalByCompetitor)) {
    competitorShares[compId] = count / totalAll
  }

  return {
    brand_share: totalBrand / totalAll,
    competitor_shares: competitorShares,
    competitor_names: competitorNames,
    total_mentions: totalAll,
  }
}
