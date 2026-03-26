import { SetPasswordForm } from '@/components/auth/set-password-form'

export const metadata = { title: 'Set password - Qime' }

export default function SetPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Set your password</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Create a password to complete your account setup.
      </p>
      <SetPasswordForm />
    </>
  )
}
