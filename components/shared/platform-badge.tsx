import { cn } from '@/lib/utils'

export function PlatformBadge({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-medium text-[var(--text-body)]',
      className
    )}>
      {name}
    </span>
  )
}
