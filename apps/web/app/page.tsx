import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Know how AI sees your brand
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Monitor your visibility across ChatGPT, Gemini, and Perplexity.
          Track mentions, measure sentiment, and stay ahead of competitors.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Log in
          </Link>
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Qime
      </footer>
    </div>
  )
}
