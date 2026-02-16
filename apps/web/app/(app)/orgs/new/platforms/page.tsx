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

export default function PlatformSelectPage() {
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
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold">Select AI platforms</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose which AI platforms to monitor for your brand.
      </p>
      <div className="mt-6 space-y-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={cn(
              'w-full rounded-lg border p-4 text-left transition-colors',
              selected.has(p.id)
                ? 'border-primary bg-primary/5'
                : 'hover:bg-accent'
            )}
          >
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-muted-foreground">{p.description}</p>
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
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
