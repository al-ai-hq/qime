import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError } from '@/lib/api/helpers'
import { computeAggregateMetrics } from '@/lib/metrics/aggregate'
import { computeShareOfVoice } from '@/lib/metrics/share-of-voice'

type Params = { params: Promise<{ orgId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { orgId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const platformId = searchParams.get('platform_id')
  const tagId = searchParams.get('tag_id')
  const topicId = searchParams.get('topic_id')

  // If tag or topic filters are provided, first resolve matching prompt_ids
  let promptIds: string[] | null = null

  if (tagId || topicId) {
    let query = supabase
      .from('prompts')
      .select('id')
      .eq('organization_id', orgId)

    if (topicId) {
      const topicIds = topicId.split(',').map(s => s.trim())
      query = query.in('topic_id', topicIds)
    }

    if (tagId) {
      const tagIds = tagId.split(',').map(s => s.trim())
      const { data: taggedPrompts } = await supabase
        .from('prompt_tags')
        .select('prompt_id')
        .in('tag_id', tagIds)

      if (!taggedPrompts || taggedPrompts.length === 0) {
        return NextResponse.json({ metrics: computeAggregateMetrics([]) })
      }

      const taggedPromptIds = taggedPrompts.map(t => t.prompt_id)
      query = query.in('id', taggedPromptIds)
    }

    const { data: matchingPrompts } = await query

    if (!matchingPrompts || matchingPrompts.length === 0) {
      return NextResponse.json({ metrics: computeAggregateMetrics([]) })
    }

    promptIds = matchingPrompts.map(p => p.id)
  }

  // Query prompt_runs
  let runsQuery = supabase
    .from('prompt_runs')
    .select('brand_mentioned, brand_cited, brand_sentiment, brand_mention_count, competitor_mentions')
    .eq('organization_id', orgId)

  if (startDate) {
    runsQuery = runsQuery.gte('created_at', startDate)
  }
  if (endDate) {
    runsQuery = runsQuery.lte('created_at', endDate)
  }
  if (platformId) {
    const platformIds = platformId.split(',').map(s => s.trim())
    runsQuery = runsQuery.in('platform_id', platformIds)
  }
  if (promptIds) {
    runsQuery = runsQuery.in('prompt_id', promptIds)
  }

  const { data: runs, error: runsError } = await runsQuery

  if (runsError) {
    return jsonError('Failed to fetch runs', 500)
  }

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('organization_id', orgId)

  const metrics = computeAggregateMetrics(runs ?? [])
  const shareOfVoice = computeShareOfVoice(runs ?? [], competitors ?? [])

  return NextResponse.json({ metrics: { ...metrics, share_of_voice: shareOfVoice } })
}
