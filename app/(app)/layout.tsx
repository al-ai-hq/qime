import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProvider } from '@/components/providers/user-provider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <UserProvider user={{ id: user.id, email: user.email! }}>
      {children}
    </UserProvider>
  )
}
