import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/tenant'

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .limit(1)

  if (memberships && memberships.length > 0) {
    redirect(`/${memberships[0].organization_id}`)
  }

  if (isAdmin(user!.email!)) {
    redirect('/setup')
  }

  redirect('/no-access')
}
