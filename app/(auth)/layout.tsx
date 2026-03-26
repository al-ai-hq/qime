import { Logo } from '@/components/shared/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        background: 'var(--surface-page)',
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(240,82,42,0.04), transparent 60%)',
      }}
    >
      <div className="mb-8">
        <Logo className="text-3xl" />
      </div>
      <div className="w-full max-w-[400px] rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-8">
        {children}
      </div>
    </div>
  )
}
