import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser, checkOrgMembership, validateBody, jsonError } from '@/lib/api/helpers'
import { createAdminClient } from '@/lib/supabase/admin'

const resendSchema = z.object({
  mode: z.enum(['send_email', 'copy_link']),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  const { orgId, memberId } = await params
  const { user, supabase, error } = await getAuthenticatedUser()
  if (!user) return jsonError(error!, 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Not a member of this organization', 403)
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return jsonError('Only owners and admins can resend invitations', 403)
  }

  const { data: body, error: validationError } = await validateBody(request, resendSchema)
  if (!body) return jsonError(validationError!, 400)

  // Fetch the target member
  const { data: target, error: fetchError } = await supabase
    .from('organization_members')
    .select('id, user_id')
    .eq('id', memberId)
    .eq('organization_id', orgId)
    .single()

  if (fetchError || !target) return jsonError('Member not found', 404)

  const admin = createAdminClient()
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(target.user_id)

  if (!authUser) return jsonError('User not found', 404)
  if (authUser.last_sign_in_at) return jsonError('User has already accepted the invitation', 400)

  let inviteLink: string | undefined
  const origin = new URL(request.url).origin

  if (body.mode === 'send_email') {
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(authUser.email!, {
      redirectTo: `${origin}/api/auth/confirm?type=invite`,
    })
    if (inviteError) return jsonError(inviteError.message, 500)
  } else {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: authUser.email!,
    })
    if (linkError) return jsonError(linkError.message, 500)
    if (linkData?.properties?.hashed_token) {
      inviteLink = `${origin}/api/auth/confirm?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}&type=invite`
    }
  }

  return NextResponse.json({ invite_link: inviteLink })
}
