import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { MetricsOverview } from '@/components/dashboard/metrics-overview'
import { MetricsChart } from '@/components/dashboard/metrics-chart'
import { RecentRuns } from '@/components/dashboard/recent-runs'
import { PlatformBreakdown } from '@/components/dashboard/platform-breakdown'
import { ShareOfVoiceChart } from '@/components/dashboard/share-of-voice-chart'
import { CompetitorComparisonChart } from '@/components/dashboard/competitor-comparison-chart'
import { MentionCitationTrends } from '@/components/dashboard/mention-citation-trends'
import { computeShareOfVoice } from '@/lib/metrics/share-of-voice'

export const metadata = { title: 'Dashboard - Qime' }

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [recentResult, chartResult, platformsResult, competitorsResult, orgResult] = await Promise.all([
    supabase
      .from('prompt_runs')
      .select('id, prompt_id, platform_id, visibility_score, brand_mentioned, brand_cited, created_at, prompts!inner(title, organization_id)')
      .eq('prompts.organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('prompt_runs')
      .select('visibility_score, platform_id, created_at, brand_mentioned, brand_cited, brand_mention_count, competitor_mentions, prompts!inner(organization_id)')
      .eq('prompts.organization_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('organization_platforms')
      .select('platform_id, ai_platforms(name)')
      .eq('organization_id', orgId),
    supabase
      .from('competitors')
      .select('id, name')
      .eq('organization_id', orgId),
    supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single(),
  ])

  const recentRuns = recentResult.data ?? []
  const chartRuns = chartResult.data ?? []
  const platforms = platformsResult.data ?? []
  const competitors = competitorsResult.data ?? []
  const brandName = orgResult.data?.name ?? 'Your Brand'

  // Compute aggregate metrics
  const totalRuns = chartRuns.length
  const mentionCount = chartRuns.filter((r) => r.brand_mentioned).length
  const citationCount = chartRuns.filter((r) => r.brand_cited).length
  const avgScore = totalRuns > 0
    ? chartRuns.reduce((sum, r) => sum + r.visibility_score, 0) / totalRuns
    : 0

  // Compute share of voice
  const shareOfVoice = computeShareOfVoice(
    chartRuns.map((r) => ({
      brand_mention_count: (r as unknown as { brand_mention_count: number }).brand_mention_count ?? 0,
      competitor_mentions: (r as unknown as { competitor_mentions: Record<string, number> }).competitor_mentions ?? {},
    })),
    competitors,
  )

  const metricsData = {
    visibility_score: avgScore,
    mention_frequency: totalRuns > 0 ? mentionCount / totalRuns : 0,
    citation_frequency: totalRuns > 0 ? citationCount / totalRuns : 0,
    total_runs: totalRuns,
    share_of_voice: shareOfVoice,
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Dashboard" />
      <MetricsOverview metrics={metricsData} />
      <div className="grid gap-4 lg:grid-cols-2">
        <MetricsChart runs={chartRuns} />
        <ShareOfVoiceChart data={shareOfVoice} brandName={brandName} />
        <PlatformBreakdown runs={chartRuns} platforms={platforms as unknown as { platform_id: string; ai_platforms: { name: string } | null }[]} />
        <CompetitorComparisonChart
          runs={chartRuns as unknown as { visibility_score: number; brand_mentioned: boolean; competitor_mentions: Record<string, number>; created_at: string }[]}
          competitors={competitors}
          brandName={brandName}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MentionCitationTrends runs={chartRuns} />
      </div>
      <RecentRuns runs={recentRuns as unknown as { id: string; prompt_id: string; platform_id: string; visibility_score: number; brand_mentioned: boolean; brand_cited: boolean; created_at: string; prompts: { title: string } | null }[]} orgId={orgId} />
    </div>
  )
}
