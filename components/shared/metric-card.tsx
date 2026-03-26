import type { LucideIcon } from 'lucide-react'
import { DeltaIndicator } from '@/components/shared/delta-indicator'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  delta?: { value: number; suffix?: string; period?: string }
}

export function MetricCard({ icon: Icon, label, value, delta }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] px-5 py-[18px] transition-colors hover:bg-[var(--hover-surface)]">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Icon className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
        {label}
      </div>
      <div className="text-[28px] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
        {value}
      </div>
      {delta && <div className="mt-1.5"><DeltaIndicator {...delta} /></div>}
    </div>
  )
}
