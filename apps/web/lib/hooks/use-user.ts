'use client'

import { createContext, useContext } from 'react'
import type { User } from '@/lib/types'

export const UserContext = createContext<User | null>(null)

export function useUser() {
  const user = useContext(UserContext)
  if (!user) throw new Error('useUser must be used within UserProvider')
  return user
}
