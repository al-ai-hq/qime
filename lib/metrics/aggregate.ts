interface RunRecord {
  brand_mentioned: boolean | null
  brand_cited: boolean
  brand_sentiment: 'positive' | 'neutral' | 'negative' | null
}

interface AggregateMetrics {
  mention_frequency: number
  citation_frequency: number
  sentiment_score: number
  visibility_score: number
  total_runs: number
}

export function computeAggregateMetrics(runs: RunRecord[]): AggregateMetrics {
  if (runs.length === 0) {
    return {
      mention_frequency: 0,
      citation_frequency: 0,
      sentiment_score: 0,
      visibility_score: 0,
      total_runs: 0,
    }
  }

  const total = runs.length
  const mentionFrequency = runs.filter(r => r.brand_mentioned === true).length / total
  const citationFrequency = runs.filter(r => r.brand_cited === true).length / total

  const sentimentValues: number[] = []
  for (const r of runs) {
    if (r.brand_sentiment === 'positive') sentimentValues.push(1.0)
    else if (r.brand_sentiment === 'neutral') sentimentValues.push(0.5)
    else if (r.brand_sentiment === 'negative') sentimentValues.push(0.0)
  }

  const sentimentScore = sentimentValues.length > 0
    ? sentimentValues.reduce((a, b) => a + b, 0) / sentimentValues.length
    : 0

  const visibilityScore = 0.5 * mentionFrequency + 0.3 * citationFrequency + 0.2 * sentimentScore

  return {
    mention_frequency: mentionFrequency,
    citation_frequency: citationFrequency,
    sentiment_score: sentimentScore,
    visibility_score: visibilityScore,
    total_runs: total,
  }
}
