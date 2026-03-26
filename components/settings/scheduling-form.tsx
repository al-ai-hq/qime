'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { OrgSettings } from '@/lib/types'

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'every_other_day', label: 'Every other day' },
]

export function SchedulingForm({ orgId, settings }: { orgId: string; settings: OrgSettings | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [frequency, setFrequency] = useState(settings?.run_frequency ?? 'daily')
  const [minHours, setMinHours] = useState(settings?.min_hours_between_runs?.toString() ?? '24')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.settings.update(orgId, {
        run_frequency: frequency,
        min_hours_between_runs: parseInt(minHours, 10),
      })
      toast.success('Scheduling updated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-[var(--text-secondary)]">Scheduling</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Configure how often prompts are automatically run against AI platforms</p>
      <form onSubmit={onSubmit} className="mt-4 max-w-[640px] space-y-4">
        <div className="space-y-2">
          <Label className="text-[var(--text-body)]">Run frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="min-hours" className="text-[var(--text-body)]">Minimum hours between runs</Label>
          <Input
            id="min-hours"
            type="number"
            min={1}
            max={168}
            value={minHours}
            onChange={(e) => setMinHours(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </section>
  )
}
