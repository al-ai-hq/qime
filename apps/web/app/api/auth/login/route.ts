import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validators'
import { jsonError, validateBody } from '@/lib/api/helpers'

export async function POST(request: Request) {
  const { data, error: validationError } = await validateBody(request, loginSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) return jsonError(error.message, error.status ?? 401)

  return NextResponse.json({
    user: { id: authData.user.id, email: authData.user.email },
    session: { access_token: authData.session.access_token, expires_at: authData.session.expires_at },
  })
}
