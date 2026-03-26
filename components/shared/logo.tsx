import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ className, linkTo = '/' }: { className?: string; linkTo?: string }) {
  return (
    <Link href={linkTo} className={cn('text-2xl font-bold tracking-tight text-[var(--text-primary)]', className)}>
      Q<span className="text-[var(--accent-primary)]">.</span>
    </Link>
  )
}
