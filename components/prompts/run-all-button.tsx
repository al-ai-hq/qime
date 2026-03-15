'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import type { Prompt } from '@/lib/types'

const DELAY_BETWEEN_RUNS_MS = 10_000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function RunAllButton({ orgId, prompts }: { orgId: string; prompts: Prompt[] }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const cancelledRef = useRef(false)

  const activePrompts = prompts.filter((p) => p.is_active)

  const handleRunAll = useCallback(async () => {
    if (activePrompts.length === 0) {
      toast.error('No active prompts to run')
      return
    }

    cancelledRef.current = false
    setRunning(true)
    setProgress({ current: 0, total: activePrompts.length })

    let completed = 0
    let failed = 0

    for (let i = 0; i < activePrompts.length; i++) {
      if (cancelledRef.current) break

      const prompt = activePrompts[i]
      setProgress({ current: i + 1, total: activePrompts.length })

      try {
        await api.prompts.run(orgId, prompt.id)
        completed++
      } catch {
        failed++
        toast.error(`Failed to run "${prompt.title}"`)
      }

      // Wait 10 seconds before the next run, unless this is the last one or cancelled
      if (i < activePrompts.length - 1 && !cancelledRef.current) {
        await sleep(DELAY_BETWEEN_RUNS_MS)
      }
    }

    setRunning(false)

    if (cancelledRef.current) {
      toast.info(`Stopped after ${completed} of ${activePrompts.length} prompt(s)`)
    } else if (failed === 0) {
      toast.success(`All ${completed} prompt(s) completed`)
    } else {
      toast.warning(`${completed} succeeded, ${failed} failed`)
    }

    router.refresh()
  }, [activePrompts, orgId, router])

  const handleCancel = useCallback(() => {
    cancelledRef.current = true
  }, [])

  if (running) {
    return (
      <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2">
        <Square className="h-4 w-4" />
        Stop ({progress.current}/{progress.total})
      </Button>
    )
  }

  return (
    <Button
      onClick={handleRunAll}
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={activePrompts.length === 0}
    >
      <Play className="h-4 w-4" />
      Run all
    </Button>
  )
}
