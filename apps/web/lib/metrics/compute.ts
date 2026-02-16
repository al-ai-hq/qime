import type { AIProviderResponse } from '@/lib/ai/types'

interface Competitor {
  id: string
  name: string
  website: string | null
}

interface MetricsResult {
  brand_mentioned: boolean
  brand_mention_count: number
  brand_sentiment: 'positive' | 'neutral' | 'negative' | null
  brand_cited: boolean
  mentioned_competitors: string[]
  organization_position: number | null
  competitor_mentions: Record<string, number>
  cited_urls: { url: string; title?: string }[]
  response_length: number
  visibility_score: number
}

export function computeMetrics(
  response: AIProviderResponse,
  brandName: string,
  brandWebsite: string | null,
  competitors: Competitor[]
): MetricsResult {
  const text = response.text.toLowerCase()
  const brandLower = brandName.toLowerCase()

  // Brand mentions
  const brandMentionCount = countOccurrences(text, brandLower)
  const brandMentioned = brandMentionCount > 0

  // Brand sentiment (hardcoded neutral when mentioned, null otherwise)
  const brandSentiment = brandMentioned ? 'neutral' as const : null

  // Competitor mentions
  const competitorMentions: Record<string, number> = {}
  for (const competitor of competitors) {
    const count = countOccurrences(text, competitor.name.toLowerCase())
    if (count > 0) {
      competitorMentions[competitor.id] = count
    }
  }

  // URL analysis
  const citedUrls = response.citedUrls
  const brandCited = brandWebsite
    ? citedUrls.some(u => u.url.includes(new URL(brandWebsite).hostname))
    : false

  // Mentioned competitors: ordered by first appearance in response text
  const mentionedCompetitors = competitors
    .map(c => ({ name: c.name, index: text.indexOf(c.name.toLowerCase()) }))
    .filter(c => c.index !== -1)
    .sort((a, b) => a.index - b.index)
    .map(c => c.name)

  // Organization position
  const organizationPosition = computeOrganizationPosition(text, brandLower, brandMentioned, competitors)

  // Visibility score (0-100) — kept for backward compat
  const visibilityScore = calculateVisibilityScore({
    brandMentioned,
    brandMentionCount,
    brandSentiment,
    brandUrlMentioned: brandCited,
    competitorCount: Object.keys(competitorMentions).length,
    totalCompetitors: competitors.length,
    citedUrlCount: citedUrls.length,
  })

  return {
    brand_mentioned: brandMentioned,
    brand_mention_count: brandMentionCount,
    brand_sentiment: brandSentiment,
    brand_cited: brandCited,
    mentioned_competitors: mentionedCompetitors,
    organization_position: organizationPosition,
    competitor_mentions: competitorMentions,
    cited_urls: citedUrls,
    response_length: response.text.length,
    visibility_score: visibilityScore,
  }
}

function countOccurrences(text: string, term: string): number {
  if (!term) return 0
  let count = 0
  let pos = 0
  while ((pos = text.indexOf(term, pos)) !== -1) {
    count++
    pos += term.length
  }
  return count
}

function computeOrganizationPosition(
  text: string,
  brandLower: string,
  brandMentioned: boolean,
  competitors: Competitor[]
): number | null {
  // Build list of all mentioned companies with first-occurrence index
  const companies: { name: string; index: number }[] = []

  if (brandMentioned) {
    companies.push({ name: brandLower, index: text.indexOf(brandLower) })
  }

  for (const competitor of competitors) {
    const idx = text.indexOf(competitor.name.toLowerCase())
    if (idx !== -1) {
      companies.push({ name: competitor.name.toLowerCase(), index: idx })
    }
  }

  // Need at least 2 companies and brand must be mentioned
  if (companies.length < 2 || !brandMentioned) return null

  // Sort by first-occurrence index
  companies.sort((a, b) => a.index - b.index)

  const rank = companies.findIndex(c => c.name === brandLower)
  const n = companies.length

  // position = 1.0 - 0.75 * (rank / (n - 1))
  return 1.0 - 0.75 * (rank / (n - 1))
}

function calculateVisibilityScore(params: {
  brandMentioned: boolean
  brandMentionCount: number
  brandSentiment: string | null
  brandUrlMentioned: boolean
  competitorCount: number
  totalCompetitors: number
  citedUrlCount: number
}): number {
  let score = 0

  // Brand mentioned (0-30 points)
  if (params.brandMentioned) {
    score += 15
    score += Math.min(15, params.brandMentionCount * 5)
  }

  // Sentiment (0-25 points)
  if (params.brandSentiment === 'positive') score += 25
  else if (params.brandSentiment === 'neutral') score += 15
  else if (params.brandSentiment === 'negative') score += 5

  // Brand URL cited (0-20 points)
  if (params.brandUrlMentioned) score += 20

  // Competitor dilution (0-15 points) — fewer competitors mentioned = better
  if (params.totalCompetitors > 0) {
    const ratio = 1 - (params.competitorCount / params.totalCompetitors)
    score += Math.round(ratio * 15)
  } else {
    score += 15
  }

  // Citation presence (0-10 points)
  if (params.citedUrlCount > 0) score += Math.min(10, params.citedUrlCount * 3)

  return Math.min(100, Math.max(0, score))
}
