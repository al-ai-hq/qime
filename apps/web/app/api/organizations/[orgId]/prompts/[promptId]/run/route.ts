import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError } from '@/lib/api/helpers'
import { getProvider } from '@/lib/ai'
import { computeMetrics } from '@/lib/metrics/compute'
import { calculateNextRunAt, getEffectiveFrequency } from '@/lib/scheduling/utils'

type Params = { params: Promise<{ orgId: string; promptId: string }> }

export async function POST(request: Request, { params }: Params) {
  const { orgId, promptId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  // Get prompt details
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('organization_id', orgId)
    .single()

  if (promptError || !prompt) return jsonError('Prompt not found', 404)

  // Get org details for brand info and settings
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (!org) return jsonError('Organization not found', 404)

  // Get competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name, website')
    .eq('organization_id', orgId)

  // Get org platforms
  const { data: orgPlatforms } = await supabase
    .from('organization_platforms')
    .select('platform_id')
    .eq('organization_id', orgId)

  if (!orgPlatforms || orgPlatforms.length === 0) {
    return jsonError('No platforms configured for this organization', 400)
  }

  const runs = []

  for (const { platform_id } of orgPlatforms) {
    const provider = getProvider(platform_id)
    const response = await provider.query({
      prompt: prompt.prompt_text,
      platformId: platform_id,
    })

    const metrics = computeMetrics(
      response,
      org.name,
      org.website,
      competitors ?? []
    )

    const { data: run, error: runError } = await supabase
      .from('prompt_runs')
      .insert({
        prompt_id: promptId,
        platform_id,
        organization_id: orgId,
        response_text: response.text,
        cited_urls: metrics.cited_urls,
        brand_mentioned: metrics.brand_mentioned,
        brand_mention_count: metrics.brand_mention_count,
        brand_sentiment: metrics.brand_sentiment,
        brand_cited: metrics.brand_cited,
        mentioned_competitors: metrics.mentioned_competitors,
        organization_position: metrics.organization_position,
        competitor_mentions: metrics.competitor_mentions,
        response_length: metrics.response_length,
        visibility_score: metrics.visibility_score,
        run_duration_ms: response.durationMs,
        error: response.error ?? null,
      })
      .select()
      .single()

    if (!runError && run) runs.push(run)

    // Update schedule
    const { frequency, minHours } = getEffectiveFrequency(
      org.run_frequency,
      org.min_hours_between_runs,
      prompt.run_frequency_override,
      prompt.min_hours_between_runs_override
    )

    const nextRunAt = calculateNextRunAt(frequency, minHours, new Date())

    await supabase
      .from('prompt_schedules')
      .update({ last_run_at: new Date().toISOString(), next_run_at: nextRunAt.toISOString() })
      .eq('prompt_id', promptId)
      .eq('platform_id', platform_id)
  }

  return NextResponse.json({ runs }, { status: 201 })
}
