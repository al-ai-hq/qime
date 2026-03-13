'use client'

import { createContext, useContext } from 'react'
import type { Organization } from '@/lib/types'

export const OrgContext = createContext<Organization | null>(null)

export function useOrg() {
  const org = useContext(OrgContext)
  if (!org) throw new Error('useOrg must be used within OrgProvider')
  return org
}
