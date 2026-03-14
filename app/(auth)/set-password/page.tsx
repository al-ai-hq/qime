import { SetPasswordForm } from '@/components/auth/set-password-form'

export const metadata = { title: 'Set password - Qime' }

export default function SetPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-center text-2xl font-semibold">Set your password</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Create a password to complete your account setup.
      </p>
      <SetPasswordForm />
    </>
  )
}
