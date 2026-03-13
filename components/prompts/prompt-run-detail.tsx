import type { PromptRun } from '@/lib/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function PromptRunDetail({ run, competitorMap }: { run: PromptRun; competitorMap: Record<string, string> }) {
  return (
    <div className="space-y-3 bg-muted/50 p-4 text-sm">
      <div>
        <span className="font-medium">Response:</span>
        <div className="mt-1 max-h-48 overflow-y-auto rounded border border-gray-300 bg-gray-50 p-3 text-black prose prose-sm max-w-none" dir="auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {run.response_text}
          </ReactMarkdown>
        </div>
      </div>
      {run.cited_urls && run.cited_urls.length > 0 && (
        <div>
          <span className="font-medium">Cited URLs:</span>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {run.cited_urls.map((cite, i) => (
              <li key={i}>
                <a
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {cite.title || cite.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {run.competitor_mentions && Object.keys(run.competitor_mentions).length > 0 && (
        <div>
          <span className="font-medium">Competitor mentions:</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {Object.entries(run.competitor_mentions).map(([id, count]) => (
              <span key={id} className="rounded bg-muted px-2 py-0.5 text-xs">
                {competitorMap[id] ?? id}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Sentiment: {run.brand_sentiment ?? 'N/A'}</span>
        <span>Position: {run.organization_position ?? 'N/A'}</span>
        <span>Response length: {run.response_length} chars</span>
      </div>
    </div>
  )
}
