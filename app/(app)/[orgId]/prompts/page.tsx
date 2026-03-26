import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { PromptList } from '@/components/prompts/prompt-list'
import { RunAllButton } from '@/components/prompts/run-all-button'

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
          <div className="flex items-center gap-2">
            <RunAllButton orgId={orgId} prompts={prompts ?? []} />
            <Link href={`/${orgId}/prompts/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New prompt
              </Button>
            </Link>
          </div>
        }
      />
      <PromptList prompts={prompts ?? []} orgId={orgId} />
    </div>
  )
}
