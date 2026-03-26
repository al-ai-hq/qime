'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { MobileNav } from '@/components/layout/mobile-nav'

function getPageTitle(pathname: string, orgId: string): string {
  if (pathname === `/${orgId}`) return 'Dashboard'
  if (pathname.includes('/prompts/new')) return 'New Prompt'
  if (pathname.includes('/prompts') && pathname.includes('/edit')) return 'Edit Prompt'
  if (pathname.includes('/prompts/')) return 'Prompt Detail'
  if (pathname.includes('/prompts')) return 'Prompts'
  if (pathname.includes('/competitors')) return 'Competitors'
  if (pathname.includes('/settings')) return 'Settings'
  return 'Dashboard'
}

export function OrgShell({ orgId, userEmail, children }: { orgId: string; userEmail: string; children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname, orgId)

  return (
    <div className="flex min-h-screen bg-[var(--surface-page)]">
      {/* Desktop sidebar */}
      <Sidebar orgId={orgId} className="hidden md:flex" />

      {/* Mobile drawer */}
      <MobileNav orgId={orgId} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <TopBar
          pageTitle={pageTitle}
          userEmail={userEmail}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
