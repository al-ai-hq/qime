import { SignupForm } from '@/components/auth/signup-form'

export const metadata = { title: 'Sign up - Qime' }

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-center text-2xl font-semibold">Create your account</h1>
      <SignupForm />
    </>
  )
}
