import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Log in - Qime' }

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-semibold">Log in to Qime</h1>
      <LoginForm />
    </>
  )
}
