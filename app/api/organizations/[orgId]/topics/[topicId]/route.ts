import { NextResponse } from 'next/server'
import { updateTopicSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody, checkOrgMembership } from '@/lib/api/helpers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; topicId: string }> }
) {
  const { orgId, topicId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error: validationError } = await validateBody(request, updateTopicSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { data: topic, error } = await supabase
    .from('topics')
    .update(data)
    .eq('id', topicId)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return jsonError('Topic with this name already exists', 409)
    return jsonError(error.message, 500)
  }

  return NextResponse.json(topic)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; topicId: string }> }
) {
  const { orgId, topicId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)
    .eq('organization_id', orgId)

  if (error) return jsonError(error.message, 500)

  return new NextResponse(null, { status: 204 })
}
