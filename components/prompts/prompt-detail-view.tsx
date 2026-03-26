'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { PlatformBadge } from '@/components/shared/platform-badge'
import { PromptRunDetail } from '@/components/prompts/prompt-run-detail'
import type { PromptRun } from '@/lib/types'

interface PromptDetailViewProps {
  runs: PromptRun[]
  competitorMap: Record<string, string>
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-[var(--semantic-positive)]'
  if (score >= 40) return 'text-[var(--semantic-warning)]'
  return 'text-[var(--semantic-negative)]'
}

export function PromptDetailView({ runs, competitorMap }: PromptDetailViewProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(
    runs.length > 0 ? runs[0].id : null
  )

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null

  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          No runs yet. Click &quot;Run now&quot; to execute this prompt.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] overflow-hidden">
      <div className="md:grid md:grid-cols-[320px_1fr] gap-0">
        {/* Left panel - Run list */}
        <div className="border-b md:border-b-0 md:border-r border-[var(--border-subtle)] overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="p-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Run History ({runs.length})
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {runs.map((run) => {
              const isSelected = run.id === selectedRunId
              return (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`w-full text-left px-4 py-3 transition-all duration-150 ${
                    isSelected
                      ? 'bg-[var(--surface-active)] border-l-2 border-l-[var(--accent-primary)]'
                      : 'hover:bg-[var(--hover-surface)] border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <PlatformBadge name={run.platform_id} />
                    <span className={`text-sm font-semibold ${scoreColor(run.visibility_score)}`}>
                      {Math.round(run.visibility_score)}
                    </span>
                  </div>
                  <div className="mt-1 text-[var(--text-muted)] text-xs">
                    {format(new Date(run.created_at), 'MMM d, yyyy HH:mm')}
                    {' \u00b7 '}
                    {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right panel - Run detail */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {selectedRun ? (
            <PromptRunDetail run={selectedRun} competitorMap={competitorMap} />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Select a run to view details.</p>
          )}
        </div>
      </div>
    </div>
  )
}
