import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { MetricsOverview } from '@/components/dashboard/metrics-overview'
import { MetricsChart } from '@/components/dashboard/metrics-chart'
import { RecentRuns } from '@/components/dashboard/recent-runs'
import { PlatformBreakdown } from '@/components/dashboard/platform-breakdown'

export const metadata = { title: 'Dashboard - Qime' }

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await createClient()

  // Fetch all runs for this org (via inner join on prompts)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [recentResult, chartResult, platformsResult] = await Promise.all([
    supabase
      .from('prompt_runs')
      .select('id, prompt_id, platform_id, visibility_score, brand_mentioned, brand_cited, created_at, prompts!inner(title, organization_id)')
      .eq('prompts.organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('prompt_runs')
      .select('visibility_score, platform_id, created_at, brand_mentioned, brand_cited, prompts!inner(organization_id)')
      .eq('prompts.organization_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('organization_platforms')
      .select('platform_id, ai_platforms(name)')
      .eq('organization_id', orgId),
  ])

  const recentRuns = recentResult.data ?? []
  const chartRuns = chartResult.data ?? []
  const platforms = platformsResult.data ?? []

  // Compute aggregate metrics from chart runs
  const totalRuns = chartRuns.length
  const mentionCount = chartRuns.filter((r) => r.brand_mentioned).length
  const citationCount = chartRuns.filter((r) => r.brand_cited).length
  const avgScore = totalRuns > 0
    ? chartRuns.reduce((sum, r) => sum + r.visibility_score, 0) / totalRuns
    : 0

  const metricsData = {
    visibility_score: avgScore,
    mention_frequency: totalRuns > 0 ? mentionCount / totalRuns : 0,
    citation_frequency: totalRuns > 0 ? citationCount / totalRuns : 0,
    total_runs: totalRuns,
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Dashboard" description="AI visibility overview" />
      <MetricsOverview metrics={metricsData} />
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricsChart runs={chartRuns} />
        <PlatformBreakdown runs={chartRuns} platforms={platforms as unknown as { platform_id: string; ai_platforms: { name: string } | null }[]} />
      </div>
      <RecentRuns runs={recentRuns as unknown as { id: string; prompt_id: string; platform_id: string; visibility_score: number; brand_mentioned: boolean; brand_cited: boolean; created_at: string; prompts: { title: string } | null }[]} orgId={orgId} />
    </div>
  )
}
