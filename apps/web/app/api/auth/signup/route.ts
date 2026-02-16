import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signupSchema } from '@/lib/validators'
import { jsonError, validateBody } from '@/lib/api/helpers'

export async function POST(request: Request) {
  const { data, error: validationError } = await validateBody(request, signupSchema)
  if (validationError || !data) return jsonError(validationError!, 400)

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.full_name },
    },
  })

  if (error) return jsonError(error.message, error.status ?? 400)

  return NextResponse.json({
    user: authData.user ? { id: authData.user.id, email: authData.user.email } : null,
    message: 'Check your email for the confirmation link.',
  }, { status: 201 })
}
