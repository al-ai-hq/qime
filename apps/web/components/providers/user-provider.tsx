'use client'

import { UserContext } from '@/lib/hooks/use-user'
import type { User } from '@/lib/types'

export function UserProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <UserContext value={user}>{children}</UserContext>
}
