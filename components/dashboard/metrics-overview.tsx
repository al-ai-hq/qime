import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Quote, TrendingUp, BarChart3 } from 'lucide-react'

interface MetricsOverviewProps {
  metrics: {
    visibility_score?: number
    mention_frequency?: number
    citation_frequency?: number
    total_runs?: number
  } | null
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const cards = [
    {
      title: 'Visibility Score',
      value: metrics?.visibility_score != null ? `${Math.round(metrics.visibility_score)}%` : '--',
      icon: Eye,
    },
    {
      title: 'Mention Rate',
      value: metrics?.mention_frequency != null ? `${Math.round(metrics.mention_frequency * 100)}%` : '--',
      icon: Quote,
    },
    {
      title: 'Citation Rate',
      value: metrics?.citation_frequency != null ? `${Math.round(metrics.citation_frequency * 100)}%` : '--',
      icon: TrendingUp,
    },
    {
      title: 'Total Runs',
      value: metrics?.total_runs?.toString() ?? '0',
      icon: BarChart3,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
