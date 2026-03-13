import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ZodSchema } from 'zod'

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, supabase, error: 'Unauthorized' }
  return { user, supabase, error: null }
}

export async function validateBody<T>(request: Request, schema: ZodSchema<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      const message = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { data: null, error: message }
    }
    return { data: result.data, error: null }
  } catch {
    return { data: null, error: 'Invalid JSON body' }
  }
}

export async function checkOrgMembership(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, userId: string) {
  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single()
  return data
}
