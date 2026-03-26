import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/tenant'
import { OrgSetupForm } from '@/components/setup/org-setup-form'

export const metadata = { title: 'Setup - Qime' }

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email!)) {
    redirect('/no-access')
  }

  // Check if org already exists
  const admin = createAdminClient()
  const { data: orgs } = await admin
    .from('organizations')
    .select('id')
    .limit(1)

  if (orgs && orgs.length > 0) {
    const orgId = orgs[0].id

    // Ensure admin is a member (handles edge case where org exists but admin isn't in it)
    const { data: membership } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      await admin
        .from('organization_members')
        .insert({ organization_id: orgId, user_id: user.id, role: 'owner' })
    }

    redirect(`/${orgId}`)
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: 'var(--surface-page)',
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(240,82,42,0.04), transparent 60%)',
      }}
    >
      <div className="w-full max-w-[560px] rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-8">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Set up your organization</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Configure your brand to start monitoring AI visibility.
        </p>
        <OrgSetupForm />
      </div>
    </div>
  )
}
