import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Building2, Plus } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

export const metadata = { title: 'Organizations - Qime' }

export default async function OrgsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, website, created_at)')
    .eq('user_id', user!.id)

  const orgs = memberships?.map((m) => ({
    ...(m.organizations as unknown as { id: string; name: string; website?: string; created_at: string }),
    role: m.role,
  })) ?? []

  if (orgs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No organizations yet"
          description="Create your first organization to start monitoring your AI visibility."
          action={
            <Link
              href="/orgs/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create organization
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your organizations</h1>
        <Link
          href="/orgs/new"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {orgs.map((org) => (
          <Link
            key={org.id}
            href={`/${org.id}`}
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
          >
            <div>
              <p className="font-medium">{org.name}</p>
              {org.website && (
                <p className="text-sm text-muted-foreground">{org.website}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground capitalize">{org.role}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
