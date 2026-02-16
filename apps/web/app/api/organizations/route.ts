import { NextResponse } from 'next/server'
import { createOrganizationSchema } from '@/lib/validators'
import { jsonError, getAuthenticatedUser, validateBody } from '@/lib/api/helpers'

export async function POST(request: Request) {
  const { data, error: validationError } = await validateBody(request, createOrganizationSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const { user, supabase, error: authError } = await getAuthenticatedUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const { data: org, error: insertError } = await supabase
    .from('organizations')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()

  if (insertError) return jsonError(insertError.message, 500)

  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) return jsonError(memberError.message, 500)

  return NextResponse.json(org, { status: 201 })
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
