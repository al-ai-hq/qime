'use client'

import { Fragment, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function PromptRunTable({ runs }: { runs: PromptRun[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Run History</CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
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
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                  >
                    <TableCell className="capitalize">{run.platform_id}</TableCell>
                    <TableCell>
                      <Badge variant={run.visibility_score >= 50 ? 'default' : 'secondary'}>
                        {Math.round(run.visibility_score)}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.brand_mentioned ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{run.brand_cited ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{(run.duration_ms / 1000).toFixed(1)}s</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                  {expandedId === run.id && (
                    <TableRow key={`${run.id}-detail`}>
                      <TableCell colSpan={6} className="p-0">
                        <PromptRunDetail run={run} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
