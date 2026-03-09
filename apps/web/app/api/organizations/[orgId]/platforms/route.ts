import { NextResponse } from 'next/server'
import { addPlatformSchema } from '@/lib/validators'
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

  const { data, error: validationError } = await validateBody(request, addPlatformSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { data: platform, error } = await supabase
    .from('organization_platforms')
    .insert({ organization_id: orgId, platform_id: data.platform_id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return jsonError('Platform already added', 409)
    return jsonError(error.message, 500)
  }

  return NextResponse.json(platform, { status: 201 })
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

  const { data: platforms, error } = await supabase
    .from('organization_platforms')
    .select('*, ai_platforms(*)')
    .eq('organization_id', orgId)

  if (error) return jsonError(error.message, 500)

  return NextResponse.json(platforms)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Forbidden', 403)

  const { data, error: validationError } = await validateBody(request, addPlatformSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { error } = await supabase
    .from('organization_platforms')
    .delete()
    .eq('organization_id', orgId)
    .eq('platform_id', data.platform_id)

  if (error) return jsonError(error.message, 500)

  return new NextResponse(null, { status: 204 })
}
