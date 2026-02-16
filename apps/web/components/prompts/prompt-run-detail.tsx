import type { PromptRun } from '@/lib/types'

export function PromptRunDetail({ run }: { run: PromptRun }) {
  return (
    <div className="space-y-3 bg-muted/50 p-4 text-sm">
      <div>
        <span className="font-medium">Response:</span>
        <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap text-muted-foreground" dir="auto">
          {run.response_text}
        </p>
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
            {Object.entries(run.competitor_mentions).map(([name, count]) => (
              <span key={name} className="rounded bg-muted px-2 py-0.5 text-xs">
                {name}: {count}
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
