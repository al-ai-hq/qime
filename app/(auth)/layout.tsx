import { Logo } from '@/components/shared/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
