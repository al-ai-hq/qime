import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminEmail } from '@/lib/tenant'
import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Log in - Qime' }

export default async function LoginPage() {
  // If no admin account exists yet, redirect to signup for bootstrap
  const admin = createAdminClient()
  const adminEmail = getAdminEmail()
  const { data: { users } } = await admin.auth.admin.listUsers()
  const adminExists = users?.some((u) => u.email?.toLowerCase() === adminEmail.toLowerCase())

  if (!adminExists) {
    redirect('/signup')
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Welcome back</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Sign in to your account</p>
      <LoginForm />
    </>
  )
}
