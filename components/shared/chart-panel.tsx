import { cn } from '@/lib/utils'

interface ChartPanelProps {
  title: string
  period?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ChartPanel({ title, period, actions, children, className }: ChartPanelProps) {
  return (
    <div className={cn('rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">{title}</h3>
        <div className="flex items-center gap-2">
          {actions}
          {period && (
            <span className="rounded-md border border-[var(--border-primary)] bg-[var(--surface-page)] px-2.5 py-1 text-xs text-[var(--text-label)]">
              {period}
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
