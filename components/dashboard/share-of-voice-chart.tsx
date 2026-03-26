'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { ShareOfVoice } from '@/lib/types'
import { ChartPanel } from '@/components/shared/chart-panel'

const COLORS = ['#F0522A', '#C43828', '#F07A3A', '#D44E2E', '#F09A50']

interface Props {
  data: ShareOfVoice
  brandName: string
}

export function ShareOfVoiceChart({ data, brandName }: Props) {
  const chartData = [
    { name: brandName, value: data.brand_share },
    ...Object.entries(data.competitor_shares)
      .map(([id, share]) => ({ name: data.competitor_names[id] ?? id, value: share }))
      .sort((a, b) => b.value - a.value),
  ]

  if (data.total_mentions === 0) {
    return (
      <ChartPanel title="Share of Voice" period="This month">
        <div className="flex h-[200px] items-center justify-center text-sm text-[var(--text-muted)]">
          No mention data available
        </div>
      </ChartPanel>
    )
  }

  return (
    <ChartPanel title="Share of Voice" period="This month">
      <div className="flex items-center gap-6">
        <div className="w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={62}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2.5">
          {chartData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-[13px] text-[var(--text-body)]">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="min-w-[80px]">{entry.name}</span>
              <span className="font-semibold text-[var(--text-secondary)]">
                {(entry.value * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  )
}
