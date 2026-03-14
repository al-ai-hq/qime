import { NextResponse } from 'next/server'
import { getAuthenticatedUser, checkOrgMembership, jsonError } from '@/lib/api/helpers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  const { orgId, memberId } = await params
  const { user, supabase, error } = await getAuthenticatedUser()
  if (!user) return jsonError(error!, 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Not a member of this organization', 403)
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return jsonError('Only owners and admins can remove members', 403)
  }

  // Fetch the target member
  const { data: target, error: fetchError } = await supabase
    .from('organization_members')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('organization_id', orgId)
    .single()

  if (fetchError || !target) return jsonError('Member not found', 404)

  // Prevent removing the owner
  if (target.role === 'owner') {
    return jsonError('Cannot remove the organization owner', 403)
  }

  // Delete the membership
  const { error: deleteError } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)

  if (deleteError) return jsonError(deleteError.message, 500)

  // If user was pending (never signed in), clean up the auth user
  const admin = createAdminClient()
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(target.user_id)
  if (authUser && !authUser.last_sign_in_at) {
    // Check if user is a member of any other org before deleting
    const { data: otherMemberships } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', target.user_id)
      .limit(1)

    if (!otherMemberships || otherMemberships.length === 0) {
      await admin.auth.admin.deleteUser(target.user_id)
    }
  }

  return new NextResponse(null, { status: 204 })
}
