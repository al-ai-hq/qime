import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeltaIndicatorProps {
  value: number
  suffix?: string
  period?: string
  className?: string
}

export function DeltaIndicator({ value, suffix = '', period = 'vs last month', className }: DeltaIndicatorProps) {
  const isPositive = value >= 0
  const Icon = isPositive ? ChevronUp : ChevronDown

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium', className)}>
      <Icon className="h-3 w-3" style={{ color: isPositive ? 'var(--semantic-positive)' : 'var(--semantic-negative)' }} />
      <span style={{ color: isPositive ? 'var(--semantic-positive)' : 'var(--semantic-negative)' }}>
        {isPositive ? '+' : ''}{value}{suffix}
      </span>
      {period && <span className="text-[var(--text-label)]">{period}</span>}
    </div>
  )
}
