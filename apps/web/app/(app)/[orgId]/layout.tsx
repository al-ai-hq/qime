import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgProvider } from '@/components/providers/org-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { MobileNav } from '@/components/layout/mobile-nav'

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
    <OrgProvider org={org}>
      <div className="flex h-screen">
        <Sidebar orgId={orgId} className="hidden md:flex" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar orgName={org.name} userEmail={user.email!} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
        <MobileNav orgId={orgId} />
      </div>
    </OrgProvider>
  )
}
