import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/page-header'
import { Separator } from '@/components/ui/separator'
import { OrgDetailsForm } from '@/components/settings/org-details-form'
import { SchedulingForm } from '@/components/settings/scheduling-form'
import { PlatformSelector } from '@/components/settings/platform-selector'
import { TopicsManager } from '@/components/settings/topics-manager'
import { TagsManager } from '@/components/settings/tags-manager'
import { MembersList } from '@/components/settings/members-list'

export const metadata = { title: 'Settings - Qime' }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await createClient()

  const [
    { data: org },
    { data: settings },
    { data: platforms },
    { data: topics },
    { data: tags },
    { data: members },
  ] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('organization_settings').select('*').eq('organization_id', orgId).single(),
    supabase.from('organization_platforms').select('platform_id').eq('organization_id', orgId),
    supabase.from('topics').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('tags').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('organization_members').select('id, user_id, role, created_at').eq('organization_id', orgId),
  ])

  // Enrich members with email and status from auth.users
  const admin = createAdminClient()
  const enrichedMembers = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: { user: authUser } } = await admin.auth.admin.getUserById(m.user_id)
      return {
        ...m,
        user_email: authUser?.email ?? null,
        full_name: authUser?.user_metadata?.full_name ?? null,
        status: authUser?.last_sign_in_at ? 'active' as const : 'pending' as const,
      }
    })
  )

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" />

      <OrgDetailsForm orgId={orgId} org={org} />

      <Separator className="bg-[var(--border-subtle)]" />

      <SchedulingForm orgId={orgId} settings={settings} />

      <Separator className="bg-[var(--border-subtle)]" />

      <PlatformSelector
        orgId={orgId}
        activePlatforms={platforms?.map((p) => p.platform_id) ?? []}
      />

      <Separator className="bg-[var(--border-subtle)]" />

      <TopicsManager orgId={orgId} topics={topics ?? []} />

      <Separator className="bg-[var(--border-subtle)]" />

      <TagsManager orgId={orgId} tags={tags ?? []} />

      <Separator className="bg-[var(--border-subtle)]" />

      <MembersList orgId={orgId} members={enrichedMembers as import('@/lib/types').OrganizationMember[]} />
    </div>
  )
}
