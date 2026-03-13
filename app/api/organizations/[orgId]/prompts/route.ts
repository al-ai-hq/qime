import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError, validateBody } from '@/lib/api/helpers'
import { createPromptSchema } from '@/lib/validators'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error: validationError } = await validateBody(request, createPromptSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { tag_ids, ...promptData } = data

  const { data: prompt, error } = await supabase
    .from('prompts')
    .insert({
      ...promptData,
      organization_id: orgId,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 400)

  // Add tags if provided
  if (tag_ids && tag_ids.length > 0) {
    const tagRows = tag_ids.map(tag_id => ({ prompt_id: prompt.id, tag_id }))
    await supabase.from('prompt_tags').insert(tagRows)
  }

  return NextResponse.json(prompt, { status: 201 })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topic_id')
  const isActive = searchParams.get('is_active')

  let query = supabase
    .from('prompts')
    .select('*, topics(name), prompt_tags(tag_id, tags(name))')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (topicId) query = query.eq('topic_id', topicId)
  if (isActive !== null && isActive !== undefined) query = query.eq('is_active', isActive === 'true')

  const { data, error } = await query

  if (error) return jsonError(error.message, 400)

  return NextResponse.json(data)
}
