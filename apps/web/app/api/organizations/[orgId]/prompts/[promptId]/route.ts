import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError, validateBody } from '@/lib/api/helpers'
import { updatePromptSchema } from '@/lib/validators'

type Params = { params: Promise<{ orgId: string; promptId: string }> }

export async function GET(request: Request, { params }: Params) {
  const { orgId, promptId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error } = await supabase
    .from('prompts')
    .select('*, topics(name), prompt_tags(tag_id, tags(name))')
    .eq('id', promptId)
    .eq('organization_id', orgId)
    .single()

  if (error) return jsonError('Prompt not found', 404)

  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Params) {
  const { orgId, promptId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data: body, error: validationError } = await validateBody(request, updatePromptSchema)
  if (validationError || !body) return jsonError(validationError!, 400)

  const { tag_ids, ...updateData } = body

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', promptId)
      .eq('organization_id', orgId)

    if (error) return jsonError(error.message, 400)
  }

  // Update tags if provided
  if (tag_ids !== undefined) {
    await supabase.from('prompt_tags').delete().eq('prompt_id', promptId)
    if (tag_ids && tag_ids.length > 0) {
      const tagRows = tag_ids.map(tag_id => ({ prompt_id: promptId, tag_id }))
      await supabase.from('prompt_tags').insert(tagRows)
    }
  }

  const { data, error: fetchError } = await supabase
    .from('prompts')
    .select('*, topics(name), prompt_tags(tag_id, tags(name))')
    .eq('id', promptId)
    .single()

  if (fetchError) return jsonError(fetchError.message, 400)

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: Params) {
  const { orgId, promptId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId)
    .eq('organization_id', orgId)

  if (error) return jsonError(error.message, 400)

  return new NextResponse(null, { status: 204 })
}
