'use client'

import { useState, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'
import type { ShareOfVoice } from '@/lib/types'
import { ChartPanel } from '@/components/shared/chart-panel'

const COLORS = ['#F0522A', '#E8A83E', '#8B5E3C', '#F0C060', '#C43828', '#D4876E', '#A67C52']

interface Props {
  data: ShareOfVoice
  brandName: string
}

function ActiveShape(props: PieSectorDataItem) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as {
    cx: number; cy: number; innerRadius: number; outerRadius: number
    startAngle: number; endAngle: number; fill: string
  }
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={(innerRadius as number) - 3}
      outerRadius={(outerRadius as number) + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ transition: 'all 0.2s ease-out', filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' }}
    />
  )
}

export function ShareOfVoiceChart({ data, brandName }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const MAX_COMPETITORS = 5
  const competitorEntries = Object.entries(data.competitor_shares)
    .map(([id, share]) => ({ name: data.competitor_names[id] ?? id, value: share }))
    .sort((a, b) => b.value - a.value)

  const topCompetitors = competitorEntries.slice(0, MAX_COMPETITORS)
  const othersShare = competitorEntries.slice(MAX_COMPETITORS).reduce((sum, e) => sum + e.value, 0)

  const chartData = [
    { name: brandName, value: data.brand_share },
    ...topCompetitors,
    ...(othersShare > 0 ? [{ name: 'Others', value: othersShare }] : []),
  ]

  const onLegendEnter = useCallback((index: number) => setHoveredIndex(index), [])
  const onLegendLeave = useCallback(() => setHoveredIndex(null), [])

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
                {...(hoveredIndex !== null ? { activeIndex: hoveredIndex, activeShape: ActiveShape } : {})}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      transition: 'opacity 0.2s ease-out',
                      opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1,
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2.5">
          {chartData.map((entry, index) => (
            <div
              key={entry.name}
              className="flex cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-[13px] transition-colors hover:bg-[var(--hover-surface)]"
              style={{ color: hoveredIndex !== null && hoveredIndex !== index ? 'var(--text-hint)' : 'var(--text-body)' }}
              onMouseEnter={() => onLegendEnter(index)}
              onMouseLeave={onLegendLeave}
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200"
                style={{
                  background: COLORS[index % COLORS.length],
                  transform: hoveredIndex === index ? 'scale(1.4)' : 'scale(1)',
                }}
              />
              <span className="min-w-[80px]">{entry.name}</span>
              <span className="font-semibold" style={{ color: hoveredIndex !== null && hoveredIndex !== index ? 'var(--text-hint)' : 'var(--text-secondary)' }}>
                {(entry.value * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  )
}
