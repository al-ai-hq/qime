import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError } from '@/lib/api/helpers'

type Params = { params: Promise<{ orgId: string; promptId: string; runId: string }> }

export async function GET(request: Request, { params }: Params) {
  const { orgId, promptId, runId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error } = await supabase
    .from('prompt_runs')
    .select('*')
    .eq('id', runId)
    .eq('prompt_id', promptId)
    .eq('organization_id', orgId)
    .single()

  if (error) return jsonError('Run not found', 404)

  return NextResponse.json(data)
}
