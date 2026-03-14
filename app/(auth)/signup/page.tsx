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
      <h1 className="mb-2 text-center text-2xl font-semibold">Admin Setup</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Create the initial admin account for this Qime instance.
      </p>
      <SignupForm adminEmail={adminEmail} />
    </>
  )
}
