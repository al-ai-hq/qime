import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgProvider } from '@/components/providers/org-provider'
import { UserProvider } from '@/components/providers/user-provider'
import { OrgShell } from '@/components/layout/org-shell'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Check membership
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!member) notFound()

  // Get org
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (!org) notFound()

  return (
    <UserProvider user={{ id: user.id, email: user.email!, full_name: user.user_metadata?.full_name }}>
      <OrgProvider org={org}>
        <OrgShell orgId={orgId} userEmail={user.email!}>
          {children}
        </OrgShell>
      </OrgProvider>
    </UserProvider>
  )
}
