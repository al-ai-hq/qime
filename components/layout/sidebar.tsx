'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/logo'
import { useUser } from '@/lib/hooks/use-user'

const navGroups = (orgId: string) => [
  {
    label: 'Overview',
    items: [
      { href: `/${orgId}`, label: 'Dashboard', icon: LayoutDashboard, exact: true as const },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: `/${orgId}/prompts`, label: 'Prompts', icon: MessageSquare, exact: false as const },
      { href: `/${orgId}/competitors`, label: 'Competitors', icon: Users, exact: false as const },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { href: `/${orgId}/settings`, label: 'Settings', icon: Settings, exact: false as const },
    ],
  },
]

export function Sidebar({ orgId, className }: { orgId: string; className?: string }) {
  const pathname = usePathname()
  const user = useUser()
  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <aside className={cn('flex w-[240px] flex-col bg-[var(--surface-chrome)]', className)}>
      <div className="px-5 py-5">
        <Logo linkTo={`/${orgId}`} />
      </div>

      <nav className="flex-1 space-y-6 px-3">
        {navGroups(orgId).map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-label)]">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'border-l-2 border-[var(--accent-primary)] bg-[var(--surface-active)] pl-[10px] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--hover-surface)] hover:text-[var(--text-secondary)]'
                    )}
                  >
                    <item.icon className={cn('h-[18px] w-[18px]', isActive ? 'opacity-100' : 'opacity-60')} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--border-subtle)] p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-active)] text-xs font-semibold text-[var(--text-body)]">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-[var(--text-secondary)]">{user.full_name ?? user.email}</div>
            <div className="truncate text-[11px] text-[var(--text-label)]">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
