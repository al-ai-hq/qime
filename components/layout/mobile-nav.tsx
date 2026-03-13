'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = (orgId: string) => [
  { href: `/${orgId}`, label: 'Home', icon: Home },
  { href: `/${orgId}/prompts`, label: 'Prompts', icon: MessageSquare },
  { href: `/${orgId}/competitors`, label: 'Competitors', icon: Users },
  { href: `/${orgId}/settings`, label: 'Settings', icon: Settings },
]

export function MobileNav({ orgId }: { orgId: string }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background md:hidden">
      {navItems(orgId).map((item) => {
        const isActive =
          item.href === `/${orgId}`
            ? pathname === `/${orgId}`
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
