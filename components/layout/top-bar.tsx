'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Building2, Menu, Search } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  pageTitle: string
  userEmail: string
  action?: React.ReactNode
  onMenuToggle?: () => void
}

export function TopBar({ pageTitle, userEmail, action, onMenuToggle }: TopBarProps) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await api.auth.logout()
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Failed to log out')
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border-chrome)] bg-[var(--surface-chrome)] px-4 md:px-7">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-base font-semibold text-[var(--text-primary)]">{pageTitle}</h1>
        <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-card)] px-3 py-1.5 text-sm text-[var(--text-muted)] md:flex">
          <Search className="h-3.5 w-3.5" />
          <span>Search prompts, competitors...</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {action}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="hidden text-sm sm:inline">{userEmail}</span>
              <Menu className="h-4 w-4 sm:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userEmail}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/orgs')}>
              <Building2 className="mr-2 h-4 w-4" />
              Switch organization
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
