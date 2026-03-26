import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminEmail } from '@/lib/tenant'
import { SignupForm } from '@/components/auth/signup-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Setup - Qime' }

export default async function SignupPage() {
  // If admin already exists, redirect to login
  const admin = createAdminClient()
  const adminEmail = getAdminEmail()
  const { data: { users } } = await admin.auth.admin.listUsers()
  const adminExists = users?.some((u) => u.email?.toLowerCase() === adminEmail.toLowerCase())

  if (adminExists) {
    redirect('/login')
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Create admin account</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Set up the first account for your organization
      </p>
      <SignupForm adminEmail={adminEmail} />
    </>
  )
}
