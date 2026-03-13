import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <OrgDetailsForm orgId={orgId} org={org} />
        </TabsContent>
        <TabsContent value="scheduling" className="mt-6">
          <SchedulingForm orgId={orgId} settings={settings} />
        </TabsContent>
        <TabsContent value="platforms" className="mt-6">
          <PlatformSelector
            orgId={orgId}
            activePlatforms={platforms?.map((p) => p.platform_id) ?? []}
          />
        </TabsContent>
        <TabsContent value="topics" className="mt-6">
          <TopicsManager orgId={orgId} topics={topics ?? []} />
        </TabsContent>
        <TabsContent value="tags" className="mt-6">
          <TagsManager orgId={orgId} tags={tags ?? []} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersList orgId={orgId} members={(members ?? []) as unknown as import('@/lib/types').OrganizationMember[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
