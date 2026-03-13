import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError } from '@/lib/api/helpers'

type Params = { params: Promise<{ orgId: string; promptId: string }> }

export async function GET(request: Request, { params }: Params) {
  const { orgId, promptId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { searchParams } = new URL(request.url)
  const platformId = searchParams.get('platform_id')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  let query = supabase
    .from('prompt_runs')
    .select('*', { count: 'exact' })
    .eq('prompt_id', promptId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (platformId) query = query.eq('platform_id', platformId)

  const { data, error, count } = await query

  if (error) return jsonError(error.message, 400)

  return NextResponse.json({ runs: data, total: count })
}
