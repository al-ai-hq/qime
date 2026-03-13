import { NextResponse } from 'next/server'
import { updateCompetitorSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody, checkOrgMembership } from '@/lib/api/helpers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; competitorId: string }> }
) {
  const { orgId, competitorId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error: validationError } = await validateBody(request, updateCompetitorSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { data: competitor, error } = await supabase
    .from('competitors')
    .update(data)
    .eq('id', competitorId)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) return jsonError(error.message, 500)

  return NextResponse.json(competitor)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; competitorId: string }> }
) {
  const { orgId, competitorId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', competitorId)
    .eq('organization_id', orgId)

  if (error) return jsonError(error.message, 500)

  return new NextResponse(null, { status: 204 })
}
