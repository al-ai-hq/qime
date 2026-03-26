'use client'

import { Fragment, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PromptRunDetail } from '@/components/prompts/prompt-run-detail'
import type { PromptRun } from '@/lib/types'

export function PromptRunTable({ runs, competitorMap }: { runs: PromptRun[]; competitorMap: Record<string, string> }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] overflow-hidden">
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Run History</h3>
      </div>
      <div className="p-4">
        {runs.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--text-muted)]">
            No runs yet. Click &quot;Run now&quot; to execute this prompt.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Mentioned</TableHead>
                <TableHead>Cited</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <Fragment key={run.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-[var(--hover-surface)]"
                    onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                  >
                    <TableCell className="capitalize text-[var(--text-body)]">{run.platform_id}</TableCell>
                    <TableCell>
                      <Badge variant={run.visibility_score >= 50 ? 'default' : 'secondary'}>
                        {Math.round(run.visibility_score)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[var(--text-body)]">{run.brand_mentioned ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-[var(--text-body)]">{run.brand_cited ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-[var(--text-body)]">{(run.duration_ms / 1000).toFixed(1)}s</TableCell>
                    <TableCell className="text-[var(--text-muted)]">
                      {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                  {expandedId === run.id && (
                    <TableRow key={`${run.id}-detail`}>
                      <TableCell colSpan={6} className="p-4">
                        <PromptRunDetail run={run} competitorMap={competitorMap} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
