import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RunButton } from '@/components/prompts/run-button'
import { PromptRunTable } from '@/components/prompts/prompt-run-table'

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
            <RunButton orgId={orgId} promptId={promptId} />
            <Link
              href={`/${orgId}/prompts/${promptId}/edit`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Prompt text:</span>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground" dir="auto">
              {prompt.prompt_text}
            </p>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="font-medium">Status: </span>
              <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                {prompt.is_active ? 'Active' : 'Paused'}
              </Badge>
            </div>
            {prompt.topics?.name && (
              <div>
                <span className="font-medium">Topic: </span>
                <span className="text-muted-foreground">{prompt.topics.name}</span>
              </div>
            )}
          </div>
          {prompt.prompt_tags && prompt.prompt_tags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Tags:</span>
              {prompt.prompt_tags.map((pt) => (
                <Badge key={pt.tag_id} variant="outline" className="text-xs">
                  {pt.tags?.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PromptRunTable runs={runs ?? []} competitorMap={competitorMap} />
    </div>
  )
}
