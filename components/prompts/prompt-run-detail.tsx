import type { PromptRun } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function PromptRunDetail({ run, competitorMap }: { run: PromptRun; competitorMap: Record<string, string> }) {
  return (
    <div className="space-y-5">
      {/* Response */}
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Response
        </h4>
        <div
          className="max-h-[400px] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-active)] p-4 prose prose-sm prose-invert max-w-none text-[var(--text-body)]"
          dir="auto"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {run.response_text}
          </ReactMarkdown>
        </div>
      </div>

      {/* Score & Metrics */}
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Scoring
        </h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-active)] p-3 text-center">
            <div className="text-lg font-semibold text-[var(--text-primary)]">{Math.round(run.visibility_score)}</div>
            <div className="text-xs text-[var(--text-muted)]">Score</div>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-active)] p-3 text-center">
            <div className="text-lg font-semibold text-[var(--text-primary)]">{run.brand_mentioned ? 'Yes' : 'No'}</div>
            <div className="text-xs text-[var(--text-muted)]">Mentioned</div>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-active)] p-3 text-center">
            <div className="text-lg font-semibold text-[var(--text-primary)]">{run.brand_cited ? 'Yes' : 'No'}</div>
            <div className="text-xs text-[var(--text-muted)]">Cited</div>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-active)] p-3 text-center">
            <div className="text-lg font-semibold text-[var(--text-primary)]">{(run.duration_ms / 1000).toFixed(1)}s</div>
            <div className="text-xs text-[var(--text-muted)]">Duration</div>
          </div>
        </div>
      </div>

      {/* Cited URLs */}
      {run.cited_urls && run.cited_urls.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Cited URLs
          </h4>
          <ul className="space-y-1">
            {run.cited_urls.map((cite, i) => (
              <li key={i}>
                <a
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--accent-primary)] hover:underline"
                >
                  {cite.title || cite.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competitor mentions */}
      {run.competitor_mentions && Object.keys(run.competitor_mentions).length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Competitor Mentions
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(run.competitor_mentions).map(([id, count]) => (
              <span
                key={id}
                className="rounded-md bg-[var(--surface-active)] border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-body)]"
              >
                {competitorMap[id] ?? id}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
        <span>Sentiment: {run.brand_sentiment ?? 'N/A'}</span>
        <span>Position: {run.organization_position ?? 'N/A'}</span>
        <span>Response length: {run.response_length} chars</span>
      </div>
    </div>
  )
}
