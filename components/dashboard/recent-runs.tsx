import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { PlatformBadge } from '@/components/shared/platform-badge'

interface Run {
  id: string
  prompt_id: string
  platform_id: string
  visibility_score: number
  brand_mentioned: boolean
  brand_cited: boolean
  created_at: string
  prompts?: { title: string } | null
}

export function RecentRuns({ runs, orgId }: { runs: Run[]; orgId: string }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">Recent Runs</h3>
        <p className="py-4 text-center text-sm text-[var(--text-muted)]">No runs yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">Recent Runs</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Prompt</th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Platform</th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Score</th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Mentioned</th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--text-muted)]">Cited</th>
              <th className="pb-2.5 text-left text-xs font-medium text-[var(--text-muted)]">When</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-b border-[var(--border-subtle)] last:border-0 transition-colors hover:bg-[var(--surface-active)]">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/${orgId}/prompts/${run.prompt_id}`}
                    className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                  >
                    {run.prompts?.title ?? 'Untitled'}
                  </Link>
                </td>
                <td className="py-2.5 pr-4">
                  <PlatformBadge name={run.platform_id} />
                </td>
                <td className="py-2.5 pr-4">
                  <Badge variant={run.visibility_score >= 50 ? 'default' : 'secondary'}>
                    {Math.round(run.visibility_score)}
                  </Badge>
                </td>
                <td className="py-2.5 pr-4 text-[var(--text-body)]">
                  {run.brand_mentioned ? 'Yes' : 'No'}
                </td>
                <td className="py-2.5 pr-4 text-[var(--text-body)]">
                  {run.brand_cited ? 'Yes' : 'No'}
                </td>
                <td className="py-2.5 text-[var(--text-muted)]">
                  {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
