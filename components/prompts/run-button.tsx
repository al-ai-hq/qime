'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'

export function RunButton({ orgId, promptId }: { orgId: string; promptId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRun() {
    setLoading(true)
    try {
      const { runs } = await api.prompts.run(orgId, promptId)
      toast.success(`Completed ${runs.length} run(s)`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Run failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRun} disabled={loading} size="sm" className="gap-2">
      <Play className="h-4 w-4" />
      {loading ? 'Running...' : 'Run now'}
    </Button>
  )
}
