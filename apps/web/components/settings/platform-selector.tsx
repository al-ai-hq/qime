'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI Platforms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={loading === p.id}
              onClick={() => toggle(p.id)}
              className={cn(
                'w-full max-w-md rounded-lg border p-4 text-left transition-colors',
                active.has(p.id)
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent'
              )}
            >
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
