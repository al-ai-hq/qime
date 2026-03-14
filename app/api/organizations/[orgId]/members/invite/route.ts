import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser, checkOrgMembership, validateBody, jsonError } from '@/lib/api/helpers'
import { createAdminClient } from '@/lib/supabase/admin'

const inviteSchema = z.object({
  email: z.string().email(),
})

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

  // Find user by email
  const { data: { users } } = await admin.auth.admin.listUsers()
  let targetUser = users?.find((u) => u.email === body.email)

  // Auto-create user if not found
  if (!targetUser) {
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: body.email,
      email_confirm: true,
    })

    if (createError) return jsonError(createError.message, 500)
    targetUser = newUser.user
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', targetUser.id)
    .single()

  if (existing) return jsonError('User is already a member', 409)

  const { data: member, error: insertError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: targetUser.id,
      role: 'member',
    })
    .select()
    .single()

  if (insertError) return jsonError(insertError.message, 500)

  return NextResponse.json({ member }, { status: 201 })
}
