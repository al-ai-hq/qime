import { NextResponse } from 'next/server'
import { createOrganizationSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody } from '@/lib/api/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/tenant'

export async function POST(request: Request) {
  const { data, error: validationError } = await validateBody(request, createOrganizationSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { user, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  // Only admin can create organizations
  if (!isAdmin(user.email!)) {
    return jsonError('Only the admin can create organizations', 403)
  }

  const admin = createAdminClient()

  // Only one organization allowed in single-tenant mode
  const { count } = await admin
    .from('organizations')
    .select('id', { count: 'exact', head: true })

  if (count && count > 0) {
    return jsonError('An organization already exists', 409)
  }

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
