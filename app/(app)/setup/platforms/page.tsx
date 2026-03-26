'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT', description: 'OpenAI\'s conversational AI' },
  { id: 'gemini', name: 'Gemini', description: 'Google\'s AI assistant' },
  { id: 'perplexity', name: 'Perplexity', description: 'AI-powered search engine' },
]

export default function SetupPlatformSelectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgId = searchParams.get('orgId')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onSubmit() {
    if (!orgId) return
    setLoading(true)
    try {
      await Promise.all(
        Array.from(selected).map((platformId) => api.platforms.add(orgId, platformId))
      )
      toast.success('Platforms configured')
      router.push(`/${orgId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save platforms')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: 'var(--surface-page)',
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(240,82,42,0.04), transparent 60%)',
      }}
    >
      <div className="w-full max-w-[560px] rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-8">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Select AI platforms to monitor</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Choose which AI platforms to monitor for your brand.
        </p>
        <div className="mt-6 grid gap-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn(
                'w-full rounded-xl border p-4 text-left transition-colors',
                selected.has(p.id)
                  ? 'border-l-2 border-l-[var(--accent-primary)] bg-[var(--accent-subtle)] border-[var(--border-primary)]'
                  : 'border-[var(--border-primary)] bg-[var(--surface-card)] text-[var(--text-muted)] hover:bg-[var(--surface-active)]'
              )}
            >
              <p className={cn(
                'font-medium',
                selected.has(p.id) ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
              )}>{p.name}</p>
              <p className="text-sm text-[var(--text-muted)]">{p.description}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => orgId && router.push(`/${orgId}`)}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={onSubmit}
            disabled={selected.size === 0 || loading}
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </Button>
        </div>
      </div>
    </div>
  )
}
