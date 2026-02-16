import { NextResponse } from 'next/server'
import { createOrganizationSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody } from '@/lib/api/helpers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { data, error: validationError } = await validateBody(request, createOrganizationSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { user, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  // Use admin client to bypass RLS for org creation (user can't be a member
  // of an org that doesn't exist yet, so the RLS policy would block this)
  const admin = createAdminClient()

  const { data: org, error: insertError } = await admin
    .from('organizations')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (insertError) return jsonError(insertError.message, 500)

  const { error: memberError } = await admin
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) return jsonError(memberError.message, 500)

  return NextResponse.json({ organization: org }, { status: 201 })
}

export async function GET() {
  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select('role, organizations(*)')
    .eq('user_id', user.id)

  if (error) return jsonError(error.message, 500)

  const organizations = memberships?.map((m) => ({
    ...m.organizations,
    role: m.role,
  })) ?? []

  return NextResponse.json(organizations)
}
