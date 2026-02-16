import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { PromptForm } from '@/components/prompts/prompt-form'

export const metadata = { title: 'New Prompt - Qime' }

export default async function NewPromptPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await createClient()

  const [{ data: topics }, { data: tags }] = await Promise.all([
    supabase.from('topics').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('tags').select('*').eq('organization_id', orgId).order('name'),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="New prompt" />
      <PromptForm orgId={orgId} topics={topics ?? []} tags={tags ?? []} />
    </div>
  )
}
