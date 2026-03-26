'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { ShieldOff } from 'lucide-react'

export default function NoAccessPage() {
  const router = useRouter()

  async function handleLogout() {
    await api.auth.logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: 'var(--surface-page)',
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(240,82,42,0.04), transparent 60%)',
      }}
    >
      <div className="w-full max-w-[400px] rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-overlay)]">
          <ShieldOff className="h-6 w-6 text-[var(--text-label)]" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">No Access</h1>
        <p className="mt-2 text-sm text-[var(--text-body)]">
          You don&apos;t have access to any organization. Contact your administrator.
        </p>
        <Button variant="ghost" className="mt-6" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  )
}
