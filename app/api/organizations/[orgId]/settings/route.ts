import { NextResponse } from 'next/server'
import { updateOrgSettingsSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody, checkOrgMembership } from '@/lib/api/helpers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data: org, error } = await supabase
    .from('organizations')
    .select('run_frequency, min_hours_between_runs')
    .eq('id', orgId)
    .single()

  if (error) return jsonError(error.message, 404)

  return NextResponse.json(org)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error: validationError } = await validateBody(request, updateOrgSettingsSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { data: org, error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', orgId)
    .select('run_frequency, min_hours_between_runs')
    .single()

  if (error) return jsonError(error.message, 500)

  return NextResponse.json(org)
}
