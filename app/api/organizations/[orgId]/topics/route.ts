import { NextResponse } from 'next/server'
import { createTopicSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody, checkOrgMembership } from '@/lib/api/helpers'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error: validationError } = await validateBody(request, createTopicSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { data: topic, error } = await supabase
    .from('topics')
    .insert({ ...data, organization_id: orgId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return jsonError('Topic with this name already exists', 409)
    return jsonError(error.message, 500)
  }

  return NextResponse.json(topic, { status: 201 })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data: topics, error } = await supabase
    .from('topics')
    .select('*')
    .eq('organization_id', orgId)

  if (error) return jsonError(error.message, 500)

  return NextResponse.json(topics)
}
