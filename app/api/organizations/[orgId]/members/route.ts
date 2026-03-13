import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError } from '@/lib/api/helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const { user, supabase, error } = await getAuthenticatedUser()
  if (!user) return jsonError(error!, 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Not a member of this organization', 403)

  const { data: members, error: dbError } = await supabase
    .from('organization_members')
    .select('id, user_id, role, created_at')
    .eq('organization_id', orgId)
    .order('created_at')

  if (dbError) return jsonError(dbError.message, 500)

  return NextResponse.json({ members })
}
