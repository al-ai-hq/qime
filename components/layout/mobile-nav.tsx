'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, LayoutDashboard, MessageSquare, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/logo'

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

interface MobileNavProps {
  orgId: string
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ orgId, isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] transform bg-[var(--surface-chrome)] transition-transform duration-200 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo linkTo={`/${orgId}`} />
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-6 px-3">
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
                      onClick={onClose}
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
      </aside>
    </>
  )
}
