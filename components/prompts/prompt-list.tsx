'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Search, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FilterPills } from '@/components/shared/filter-pills'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import type { Prompt } from '@/lib/types'

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
]

export function PromptList({ prompts, orgId }: { prompts: Prompt[]; orgId: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt_text.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'paused' && !p.is_active)
    return matchesSearch && matchesStatus
  })

  if (prompts.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-12 w-12" />}
        title="No prompts yet"
        description="Create a prompt to start monitoring how AI platforms respond to queries about your brand."
        action={
          <Link href={`/${orgId}/prompts/new`}>
            <Button>Create prompt</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterPills options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="space-y-2">
        {filtered.map((prompt) => {
          const lastRun = prompt.prompt_schedules?.[0]?.last_run_at
          return (
            <Link
              key={prompt.id}
              href={`/${orgId}/prompts/${prompt.id}`}
              className="block rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-4 hover:bg-[var(--hover-surface)] transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[var(--text-secondary)] font-medium truncate" dir="auto">
                    {prompt.title}
                  </h3>
                  {prompt.topics?.name && (
                    <span className="mt-1 inline-block text-xs text-[var(--text-muted)]">
                      {prompt.topics.name}
                    </span>
                  )}
                  {prompt.prompt_tags && prompt.prompt_tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {prompt.prompt_tags.map((pt) => (
                        <Badge key={pt.tag_id} variant="outline" className="text-xs">
                          {pt.tags?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                    {prompt.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              </div>
              {lastRun && (
                <p className="mt-2 text-[var(--text-muted)] text-xs">
                  Last run {formatDistanceToNow(new Date(lastRun), { addSuffix: true })}
                </p>
              )}
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">
            No prompts match your search.
          </p>
        )}
      </div>
    </div>
  )
}
