import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { PromptList } from '@/components/prompts/prompt-list'

export const metadata = { title: 'Prompts - Qime' }

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await createClient()

  const { data: prompts } = await supabase
    .from('prompts')
    .select('*, topics(name), prompt_tags(tag_id, tags(name)), prompt_schedules(next_run_at, last_run_at)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompts"
        description="Manage the prompts used to monitor your AI visibility."
        action={
          <Link
            href={`/${orgId}/prompts/new`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New prompt
          </Link>
        }
      />
      <PromptList prompts={prompts ?? []} orgId={orgId} />
    </div>
  )
}
