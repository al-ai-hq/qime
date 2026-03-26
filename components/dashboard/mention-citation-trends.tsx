'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartPanel } from '@/components/shared/chart-panel'

interface Run {
  brand_mentioned: boolean
  brand_cited: boolean
  created_at: string
}

interface Props {
  runs: Run[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--surface-card)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-[var(--text-muted)]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[var(--text-body)]">{entry.name}:</span>
          <span className="font-medium text-[var(--text-primary)]">{entry.value}%</span>
        </div>
      ))}
    </div>
  )
}

export function MentionCitationTrends({ runs }: Props) {
  const data = useMemo(() => {
    if (runs.length === 0) return []

    const byDate = new Map<string, { mentions: number; citations: number; total: number }>()

    for (const run of runs) {
      const date = format(new Date(run.created_at), 'MMM d')
      const entry = byDate.get(date) ?? { mentions: 0, citations: 0, total: 0 }
      entry.total += 1
      if (run.brand_mentioned) entry.mentions += 1
      if (run.brand_cited) entry.citations += 1
      byDate.set(date, entry)
    }

    return Array.from(byDate.entries()).map(([date, entry]) => ({
      date,
      'Mention Rate': Math.round((entry.mentions / entry.total) * 100),
      'Citation Rate': Math.round((entry.citations / entry.total) * 100),
    }))
  }, [runs])

  if (data.length === 0) {
    return (
      <ChartPanel title="Mention & Citation Trends" className="lg:col-span-2">
        <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
          No data yet. Run some prompts to see trends.
        </div>
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Mention & Citation Trends" className="lg:col-span-2">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
          <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="Mention Rate" stroke="#F0522A" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Citation Rate" stroke="#F07A3A" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-body)]">
          <div className="h-0.5 w-4 rounded-full" style={{ background: '#F0522A' }} />
          <span>Mention Rate</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-body)]">
          <div className="h-0.5 w-4 rounded-full" style={{ background: '#F07A3A' }} />
          <span>Citation Rate</span>
        </div>
      </div>
    </ChartPanel>
  )
}
