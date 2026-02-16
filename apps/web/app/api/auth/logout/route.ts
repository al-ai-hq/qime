import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsonError } from '@/lib/api/helpers'

export async function POST() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) return jsonError(error.message, 500)

  return NextResponse.json({ message: 'Logged out successfully' })
}
