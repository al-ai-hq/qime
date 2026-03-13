'use client'

import { OrgContext } from '@/lib/hooks/use-org'
import type { Organization } from '@/lib/types'

export function OrgProvider({ org, children }: { org: Organization; children: React.ReactNode }) {
  return <OrgContext value={org}>{children}</OrgContext>
}
