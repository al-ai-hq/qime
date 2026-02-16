import { NextResponse } from 'next/server'
import { updateTagSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody, checkOrgMembership } from '@/lib/api/helpers'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; tagId: string }> }
) {
  const { orgId, tagId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error: validationError } = await validateBody(request, updateTagSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { data: tag, error } = await supabase
    .from('tags')
    .update(data)
    .eq('id', tagId)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return jsonError('Tag with this name already exists', 409)
    return jsonError(error.message, 500)
  }

  return NextResponse.json(tag)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; tagId: string }> }
) {
  const { orgId, tagId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('organization_id', orgId)

  if (error) return jsonError(error.message, 500)

  return new NextResponse(null, { status: 204 })
}
