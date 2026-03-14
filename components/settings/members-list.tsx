'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Link2, MoreHorizontal, Trash2, Send } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { OrganizationMember } from '@/lib/types'

export function MembersList({ orgId, members }: { orgId: string; members: OrganizationMember[] }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => Promise<void>
  }>({ open: false, title: '', description: '', onConfirm: async () => {} })
  const [confirming, setConfirming] = useState(false)

  async function handleInvite(mode: 'send_email' | 'copy_link') {
    if (!email.trim()) return
    setInviting(true)
    try {
      const result = await api.members.invite(orgId, email.trim(), mode)
      if (mode === 'copy_link' && result.invite_link) {
        await navigator.clipboard.writeText(result.invite_link)
        toast.success('Invite link copied to clipboard')
      } else {
        toast.success('Invitation email sent')
      }
      setEmail('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  async function handleResend(memberId: string, mode: 'send_email' | 'copy_link') {
    try {
      const result = await api.members.resend(orgId, memberId, mode)
      if (mode === 'copy_link' && result.invite_link) {
        await navigator.clipboard.writeText(result.invite_link)
        toast.success('Invite link copied to clipboard')
      } else {
        toast.success('Invitation email resent')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend')
    }
  }

  function handleRemove(member: OrganizationMember) {
    const isPending = member.status === 'pending'
    setConfirmDialog({
      open: true,
      title: isPending ? 'Cancel invitation' : 'Remove member',
      description: isPending
        ? `Are you sure you want to cancel the invitation for ${member.user_email ?? member.user_id}?`
        : `Are you sure you want to remove ${member.user_email ?? member.user_id} from this organization?`,
      onConfirm: async () => {
        await api.members.remove(orgId, member.id)
        toast.success(isPending ? 'Invitation cancelled' : 'Member removed')
        router.refresh()
      },
    })
  }

  async function onConfirmAction() {
    setConfirming(true)
    try {
      await confirmDialog.onConfirm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setConfirming(false)
      setConfirmDialog((prev) => ({ ...prev, open: false }))
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleInvite('send_email') }}
            className="flex max-w-lg gap-2"
          >
            <Input
              type="email"
              placeholder="Invite by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              size="sm"
              disabled={inviting || !email.trim()}
              className="gap-1"
            >
              <Send className="h-4 w-4" />
              Send Email
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={inviting || !email.trim()}
              className="gap-1"
              onClick={() => handleInvite('copy_link')}
            >
              <Link2 className="h-4 w-4" />
              Copy Link
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Send an invite email or copy an invite link for the user to set up their account.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
                  <TableCell>
                    <Badge
                      variant={m.status === 'active' ? 'default' : 'secondary'}
                      className={m.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''}
                    >
                      {m.status === 'pending' ? 'Pending' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {m.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {m.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleResend(m.id, 'send_email')}>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResend(m.id, 'copy_link')}>
                                <Link2 className="mr-2 h-4 w-4" />
                                Copy invite link
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemove(m)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {m.status === 'pending' ? 'Cancel invite' : 'Remove member'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmAction} disabled={confirming}>
              {confirming ? 'Confirming...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
