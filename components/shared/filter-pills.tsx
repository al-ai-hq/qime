'use client'

import { cn } from '@/lib/utils'

interface FilterPillsProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}

export function FilterPills({ options, value, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
            value === option.value
              ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-muted)] text-[var(--accent-primary)]'
              : 'border-[var(--border-chrome)] text-[var(--text-muted)] hover:bg-[var(--hover-surface)]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
