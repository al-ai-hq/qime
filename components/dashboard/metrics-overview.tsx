import { Eye, MessageSquare, Link, Globe, BarChart3 } from 'lucide-react'
import { MetricCard } from '@/components/shared/metric-card'
import type { ShareOfVoice } from '@/lib/types'

interface MetricsOverviewProps {
  metrics: {
    visibility_score: number
    mention_frequency: number
    citation_frequency: number
    total_runs: number
    share_of_voice?: ShareOfVoice
  }
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard
        icon={Eye}
        label="Visibility Score"
        value={metrics.visibility_score > 0 ? metrics.visibility_score.toFixed(1) : '--'}
      />
      <MetricCard
        icon={MessageSquare}
        label="Mention Rate"
        value={metrics.total_runs > 0 ? `${(metrics.mention_frequency * 100).toFixed(1)}%` : '--'}
      />
      <MetricCard
        icon={Link}
        label="Citation Rate"
        value={metrics.total_runs > 0 ? `${(metrics.citation_frequency * 100).toFixed(1)}%` : '--'}
      />
      <MetricCard
        icon={Globe}
        label="Share of Voice"
        value={metrics.share_of_voice && metrics.share_of_voice.total_mentions > 0
          ? `${(metrics.share_of_voice.brand_share * 100).toFixed(1)}%`
          : '--'}
      />
      <MetricCard
        icon={BarChart3}
        label="Total Runs"
        value={metrics.total_runs > 0 ? metrics.total_runs.toLocaleString() : '0'}
      />
    </div>
  )
}
