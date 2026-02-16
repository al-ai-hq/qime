import type { AIProviderResponse } from '@/lib/ai/types'

interface Competitor {
  id: string
  name: string
}

interface MetricsResult {
  brand_mentioned: boolean
  brand_mention_count: number
  brand_sentiment: 'positive' | 'neutral' | 'negative' | null
  competitor_mentions: Record<string, number>
  cited_urls: { url: string; title?: string }[]
  response_length: number
  visibility_score: number
}

const POSITIVE_WORDS = ['best', 'leading', 'top', 'excellent', 'recommended', 'innovative', 'outstanding', 'reliable', 'great', 'superior']
const NEGATIVE_WORDS = ['worst', 'poor', 'lacking', 'expensive', 'limited', 'outdated', 'disappointing', 'unreliable', 'bad', 'inferior']

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

  // Brand sentiment (simple keyword-based)
  const brandSentiment = brandMentioned ? analyzeSentiment(text, brandLower) : null

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
  const brandUrlMentioned = brandWebsite
    ? citedUrls.some(u => u.url.includes(new URL(brandWebsite).hostname))
    : false

  // Visibility score (0-100)
  const visibilityScore = calculateVisibilityScore({
    brandMentioned,
    brandMentionCount,
    brandSentiment,
    brandUrlMentioned,
    competitorCount: Object.keys(competitorMentions).length,
    totalCompetitors: competitors.length,
    citedUrlCount: citedUrls.length,
  })

  return {
    brand_mentioned: brandMentioned,
    brand_mention_count: brandMentionCount,
    brand_sentiment: brandSentiment,
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

function analyzeSentiment(text: string, brandTerm: string): 'positive' | 'neutral' | 'negative' {
  // Look at words near the brand mention
  const contextWindow = 100
  let positiveScore = 0
  let negativeScore = 0

  let pos = 0
  while ((pos = text.indexOf(brandTerm, pos)) !== -1) {
    const start = Math.max(0, pos - contextWindow)
    const end = Math.min(text.length, pos + brandTerm.length + contextWindow)
    const context = text.slice(start, end)

    for (const word of POSITIVE_WORDS) {
      if (context.includes(word)) positiveScore++
    }
    for (const word of NEGATIVE_WORDS) {
      if (context.includes(word)) negativeScore++
    }
    pos += brandTerm.length
  }

  if (positiveScore > negativeScore) return 'positive'
  if (negativeScore > positiveScore) return 'negative'
  return 'neutral'
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
