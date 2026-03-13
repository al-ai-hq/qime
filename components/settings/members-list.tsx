'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OrganizationMember } from '@/lib/types'

export function MembersList({ orgId, members }: { orgId: string; members: OrganizationMember[] }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    try {
      await api.members.invite(orgId, email.trim())
      setEmail('')
      toast.success('Invitation sent')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleInvite} className="flex max-w-md gap-2">
          <Input
            type="email"
            placeholder="Invite by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={inviting} className="gap-1">
            <Plus className="h-4 w-4" />
            Invite
          </Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.user_email ?? m.user_id}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {m.role}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
