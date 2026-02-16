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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Run {
  visibility_score: number
  created_at: string
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Visibility Score Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data yet. Run some prompts to see trends.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
