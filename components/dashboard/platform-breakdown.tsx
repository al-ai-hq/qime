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
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Run {
  visibility_score: number
  platform_id: string
}

interface Platform {
  platform_id: string
  ai_platforms?: { name: string } | null
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
    // Set display names from platforms
    for (const p of platforms) {
      const entry = byPlatform.get(p.platform_id)
      if (entry && p.ai_platforms?.name) entry.name = p.ai_platforms.name
    }
    return Array.from(byPlatform.values()).map((e) => ({
      name: e.name,
      score: Math.round(e.total / e.count),
    }))
  }, [runs, platforms])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">By Platform</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No platform data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
