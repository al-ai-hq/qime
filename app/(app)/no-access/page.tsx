'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'

export default function NoAccessPage() {
  const router = useRouter()

  async function handleLogout() {
    await api.auth.logout()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">No access</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        You don&apos;t have access to any organization. Contact your administrator for an invitation.
      </p>
      <Button variant="outline" className="mt-6" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  )
}
