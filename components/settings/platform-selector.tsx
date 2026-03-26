'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT', description: 'OpenAI\'s conversational AI' },
  { id: 'gemini', name: 'Gemini', description: 'Google\'s AI assistant' },
  { id: 'perplexity', name: 'Perplexity', description: 'AI-powered search engine' },
]

export function PlatformSelector({ orgId, activePlatforms }: { orgId: string; activePlatforms: string[] }) {
  const router = useRouter()
  const [active, setActive] = useState<Set<string>>(new Set(activePlatforms))
  const [loading, setLoading] = useState<string | null>(null)

  async function toggle(platformId: string) {
    setLoading(platformId)
    try {
      if (active.has(platformId)) {
        await api.platforms.remove(orgId, platformId)
        setActive((prev) => { const n = new Set(prev); n.delete(platformId); return n })
        toast.success('Platform removed')
      } else {
        await api.platforms.add(orgId, platformId)
        setActive((prev) => new Set(prev).add(platformId))
        toast.success('Platform added')
      }
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-[var(--text-secondary)]">AI Platforms</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Select which AI platforms to monitor</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {PLATFORMS.map((p) => {
          const isActive = active.has(p.id)
          return (
            <button
              key={p.id}
              type="button"
              disabled={loading === p.id}
              onClick={() => toggle(p.id)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors',
                isActive
                  ? 'border-l-2 border-l-[var(--accent-primary)] border-[var(--border-primary)] bg-[var(--accent-subtle)]'
                  : 'border-[var(--border-primary)] bg-[var(--surface-card)] text-[var(--text-muted)] hover:bg-[var(--hover-surface)]'
              )}
            >
              <p className={cn('font-medium', isActive ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]')}>
                {p.name}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{p.description}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
