import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RunButton } from '@/components/prompts/run-button'
import { PromptDetailView } from '@/components/prompts/prompt-detail-view'

export const metadata = { title: 'Prompt Detail - Qime' }

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; promptId: string }>
}) {
  const { orgId, promptId } = await params
  const supabase = await createClient()

  const { data: promptData } = await supabase
    .from('prompts')
    .select('*, topics(name), prompt_tags(tag_id, tags(name)), prompt_schedules(next_run_at, last_run_at)')
    .eq('id', promptId)
    .eq('organization_id', orgId)
    .single()

  if (!promptData) notFound()

  const prompt = promptData as unknown as {
    id: string; title: string; prompt_text: string; is_active: boolean;
    topic_id?: string; topics?: { name: string } | null;
    prompt_tags?: { tag_id: string; tags?: { name: string } }[];
    prompt_schedules?: { next_run_at?: string; last_run_at?: string }[];
  }

  const { data: runs } = await supabase
    .from('prompt_runs')
    .select('*')
    .eq('prompt_id', promptId)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, name')
    .eq('organization_id', orgId)

  const competitorMap: Record<string, string> = {}
  for (const c of competitors ?? []) {
    competitorMap[c.id] = c.name
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={prompt.title}
        action={
          <div className="flex gap-2">
            <Link href={`/${orgId}/prompts/${promptId}/edit`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <RunButton orgId={orgId} promptId={promptId} />
          </div>
        }
      />

      {/* Prompt info */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
          {prompt.is_active ? 'Active' : 'Paused'}
        </Badge>
        {prompt.topics?.name && (
          <Badge variant="outline">{prompt.topics.name}</Badge>
        )}
        {prompt.prompt_tags?.map((pt) => (
          <Badge key={pt.tag_id} variant="outline" className="text-xs">
            {pt.tags?.name}
          </Badge>
        ))}
      </div>

      {/* Prompt text */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-4">
        <p className="text-sm text-[var(--text-body)] whitespace-pre-wrap" dir="auto">
          {prompt.prompt_text}
        </p>
      </div>

      {/* Split view for runs */}
      <PromptDetailView runs={runs ?? []} competitorMap={competitorMap} />
    </div>
  )
}
