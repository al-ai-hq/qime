import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser, checkOrgMembership, validateBody, jsonError } from '@/lib/api/helpers'
import { createAdminClient } from '@/lib/supabase/admin'

const inviteSchema = z.object({
  email: z.string().email(),
  mode: z.enum(['send_email', 'copy_link']),
})

function buildInviteLink(request: Request, hashedToken: string): string {
  const origin = new URL(request.url).origin
  return `${origin}/api/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=invite`
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const { user, supabase, error } = await getAuthenticatedUser()
  if (!user) return jsonError(error!, 401)

  const membership = await checkOrgMembership(supabase, orgId, user.id)
  if (!membership) return jsonError('Not a member of this organization', 403)
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return jsonError('Only owners and admins can invite members', 403)
  }

  const { data: body, error: validationError } = await validateBody(request, inviteSchema)
  if (!body) return jsonError(validationError!, 400)

  const admin = createAdminClient()

  // Find existing user by email
  const { data: { users } } = await admin.auth.admin.listUsers()
  const existingUser = users?.find((u) => u.email === body.email)

  let targetUserId: string
  let inviteLink: string | undefined

  if (existingUser) {
    targetUserId = existingUser.id

    // If user is pending (never signed in), re-invite them
    if (!existingUser.last_sign_in_at) {
      if (body.mode === 'send_email') {
        await admin.auth.admin.inviteUserByEmail(body.email, {
          redirectTo: `${new URL(request.url).origin}/api/auth/confirm?type=invite`,
        })
      } else {
        const { data: linkData } = await admin.auth.admin.generateLink({
          type: 'invite',
          email: body.email,
        })
        if (linkData?.properties?.hashed_token) {
          inviteLink = buildInviteLink(request, linkData.properties.hashed_token)
        }
      }
    }
    // If user is active, just add them to the org (no invite needed)
  } else {
    // New user — invite or generate link
    if (body.mode === 'send_email') {
      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(body.email, {
        redirectTo: `${new URL(request.url).origin}/api/auth/confirm?type=invite`,
      })
      if (inviteError) return jsonError(inviteError.message, 500)
      targetUserId = inviteData.user.id
    } else {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'invite',
        email: body.email,
      })
      if (linkError) return jsonError(linkError.message, 500)
      targetUserId = linkData.user.id
      if (linkData.properties?.hashed_token) {
        inviteLink = buildInviteLink(request, linkData.properties.hashed_token)
      }
    }
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId)
    .single()

  if (existing) return jsonError('User is already a member', 409)

  const { data: member, error: insertError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: targetUserId,
      role: 'member',
    })
    .select()
    .single()

  if (insertError) return jsonError(insertError.message, 500)

  return NextResponse.json({ member, invite_link: inviteLink }, { status: 201 })
}
