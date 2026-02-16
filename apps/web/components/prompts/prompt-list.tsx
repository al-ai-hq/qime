'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { MessageSquare } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Prompt } from '@/lib/types'

export function PromptList({ prompts, orgId }: { prompts: Prompt[]; orgId: string }) {
  const [search, setSearch] = useState('')

  const filtered = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt_text.toLowerCase().includes(search.toLowerCase())
  )

  if (prompts.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title="No prompts yet"
        description="Create a prompt to start monitoring how AI platforms respond to queries about your brand."
        action={
          <Link
            href={`/${orgId}/prompts/new`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create prompt
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search prompts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((prompt) => (
            <TableRow key={prompt.id}>
              <TableCell>
                <Link
                  href={`/${orgId}/prompts/${prompt.id}`}
                  className="font-medium hover:underline"
                  dir="auto"
                >
                  {prompt.title}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {prompt.topics?.name ?? '--'}
              </TableCell>
              <TableCell>
                <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                  {prompt.is_active ? 'Active' : 'Paused'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {prompt.prompt_schedules?.[0]?.last_run_at
                  ? formatDistanceToNow(new Date(prompt.prompt_schedules[0].last_run_at), { addSuffix: true })
                  : 'Never'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {prompt.prompt_tags?.map((pt) => (
                    <Badge key={pt.tag_id} variant="outline" className="text-xs">
                      {pt.tags?.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
