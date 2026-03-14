import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError } from '@/lib/api/helpers'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const admin = createAdminClient()

  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: { user: authUser } } = await admin.auth.admin.getUserById(m.user_id)
      return {
        ...m,
        user_email: authUser?.email ?? null,
        full_name: authUser?.user_metadata?.full_name ?? null,
        status: authUser?.last_sign_in_at ? 'active' as const : 'pending' as const,
      }
    })
  )

  return NextResponse.json({ members: enriched })
}
