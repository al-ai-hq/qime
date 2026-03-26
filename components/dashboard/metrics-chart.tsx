'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartPanel } from '@/components/shared/chart-panel'

interface Run {
  visibility_score: number
  created_at: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--surface-card)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-[var(--text-muted)]">{label}</p>
      <p className="font-medium text-[var(--text-primary)]">{payload[0].value}</p>
    </div>
  )
}

export function MetricsChart({ runs }: { runs: Run[] }) {
  const data = useMemo(() => {
    const byDate = new Map<string, { total: number; count: number }>()
    for (const run of runs) {
      const date = format(new Date(run.created_at), 'MMM d')
      const entry = byDate.get(date) ?? { total: 0, count: 0 }
      entry.total += run.visibility_score
      entry.count += 1
      byDate.set(date, entry)
    }
    return Array.from(byDate.entries()).map(([date, { total, count }]) => ({
      date,
      score: Math.round(total / count),
    }))
  }, [runs])

  if (data.length === 0) {
    return (
      <ChartPanel title="Visibility Score Trend" period="30 days">
        <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
          No data yet. Run some prompts to see trends.
        </div>
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Visibility Score Trend" period="30 days">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0522A" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#F0522A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
          <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#F0522A"
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  )
}
