import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { PromptForm } from '@/components/prompts/prompt-form'

export const metadata = { title: 'Edit Prompt - Qime' }

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ orgId: string; promptId: string }>
}) {
  const { orgId, promptId } = await params
  const supabase = await createClient()

  const [{ data: prompt }, { data: topics }, { data: tags }] = await Promise.all([
    supabase
      .from('prompts')
      .select('*, prompt_tags(tag_id)')
      .eq('id', promptId)
      .eq('organization_id', orgId)
      .single(),
    supabase.from('topics').select('*').eq('organization_id', orgId).order('name'),
    supabase.from('tags').select('*').eq('organization_id', orgId).order('name'),
  ])

  if (!prompt) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title="Edit prompt" />
      <PromptForm orgId={orgId} topics={topics ?? []} tags={tags ?? []} prompt={prompt} />
    </div>
  )
}
