'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartPanel } from '@/components/shared/chart-panel'

const SERIES_COLORS = ['#F0522A', '#C43828', '#F07A3A', '#D44E2E', '#F09A50']

interface Run {
  visibility_score: number
  platform_id: string
}

interface Platform {
  platform_id: string
  ai_platforms?: { name: string } | null
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

export function PlatformBreakdown({ runs, platforms }: { runs: Run[]; platforms: Platform[] }) {
  const data = useMemo(() => {
    const byPlatform = new Map<string, { total: number; count: number; name: string }>()
    for (const run of runs) {
      const entry = byPlatform.get(run.platform_id) ?? { total: 0, count: 0, name: run.platform_id }
      entry.total += run.visibility_score
      entry.count += 1
      byPlatform.set(run.platform_id, entry)
    }
    for (const p of platforms) {
      const entry = byPlatform.get(p.platform_id)
      if (entry && p.ai_platforms?.name) entry.name = p.ai_platforms.name
    }
    return Array.from(byPlatform.values()).map((e) => ({
      name: e.name,
      score: Math.round(e.total / e.count),
    }))
  }, [runs, platforms])

  if (data.length === 0) {
    return (
      <ChartPanel title="Platform Breakdown" period="30 days">
        <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
          No platform data yet.
        </div>
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Platform Breakdown" period="30 days">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
          <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  )
}
