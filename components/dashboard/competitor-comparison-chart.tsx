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

const SERIES_COLORS = ['#F0522A', '#C43828', '#F07A3A', '#D44E2E', '#F09A50']

interface Run {
  visibility_score: number
  brand_mentioned: boolean
  competitor_mentions: Record<string, number>
  created_at: string
}

interface Competitor {
  id: string
  name: string
}

interface Props {
  runs: Run[]
  competitors: Competitor[]
  brandName: string
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
          <span className="font-medium text-[var(--text-primary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CompetitorComparisonChart({ runs, competitors, brandName }: Props) {
  const { data, seriesKeys } = useMemo(() => {
    if (runs.length === 0 || competitors.length === 0) {
      return { data: [], seriesKeys: [] }
    }

    // Group runs by date, compute brand avg score and competitor mention rates
    const byDate = new Map<string, { brandScores: number[]; competitorMentions: Record<string, number>; runCount: number }>()

    for (const run of runs) {
      const date = format(new Date(run.created_at), 'MMM d')
      const entry = byDate.get(date) ?? { brandScores: [], competitorMentions: {}, runCount: 0 }
      entry.brandScores.push(run.visibility_score)
      entry.runCount += 1
      for (const [compId, count] of Object.entries(run.competitor_mentions ?? {})) {
        entry.competitorMentions[compId] = (entry.competitorMentions[compId] ?? 0) + count
      }
      byDate.set(date, entry)
    }

    const competitorMap = new Map(competitors.map((c) => [c.id, c.name]))
    const keys = [brandName, ...competitors.map((c) => c.name)]

    const chartData = Array.from(byDate.entries()).map(([date, entry]) => {
      const row: Record<string, string | number> = { date }
      row[brandName] = Math.round(entry.brandScores.reduce((a, b) => a + b, 0) / entry.brandScores.length)
      for (const comp of competitors) {
        // Normalize competitor mentions as a score (0-100) relative to brand
        const mentions = entry.competitorMentions[comp.id] ?? 0
        row[competitorMap.get(comp.id) ?? comp.id] = Math.min(100, Math.round((mentions / Math.max(entry.runCount, 1)) * 100))
      }
      return row
    })

    return { data: chartData, seriesKeys: keys }
  }, [runs, competitors, brandName])

  if (data.length === 0 || competitors.length === 0) {
    return (
      <ChartPanel title="Competitor Comparison" period="30 days">
        <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
          No competitor data available
        </div>
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Competitor Comparison" period="30 days">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
          <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)' }} />
          <Tooltip content={<CustomTooltip />} />
          {seriesKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={i === 0 ? 2 : 1.5}
              strokeDasharray={i === 0 ? undefined : '5 3'}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-4">
        {seriesKeys.map((key, i) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-[var(--text-body)]">
            <div className="h-0.5 w-4 rounded-full" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length], ...(i > 0 ? { backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, var(--surface-card) 3px, var(--surface-card) 5px)' } : {}) }} />
            <span>{key}</span>
          </div>
        ))}
      </div>
    </ChartPanel>
  )
}
