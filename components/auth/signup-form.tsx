'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignupForm({ adminEmail }: { adminEmail?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState(adminEmail ?? '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.auth.signup({ email, password, full_name: fullName || undefined })
      toast.success('Check your email to confirm your account')
      router.push('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          readOnly={!!adminEmail}
          disabled={!!adminEmail}
          className={adminEmail ? 'bg-muted' : ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create admin account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Initial admin setup — only the configured admin email can register.
      </p>
    </form>
  )
}
