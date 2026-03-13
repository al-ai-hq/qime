import Link from 'next/link'

export const metadata = { title: 'Confirm email - Qime' }

export default function ConfirmPage() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold">Email confirmed</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your email has been confirmed. You can now log in.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Go to login
      </Link>
    </div>
  )
}
