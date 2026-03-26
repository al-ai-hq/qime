'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Link2, MoreHorizontal, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [showInvite, setShowInvite] = useState(false)
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
      setShowInvite(false)
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

  function getInitials(member: OrganizationMember) {
    if (member.full_name) {
      return member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    }
    if (member.user_email) {
      return member.user_email.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  return (
    <>
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-secondary)]">Members</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Manage who has access to this organization</p>
          </div>
          <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
            <Send className="mr-1.5 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {showInvite && (
          <form
            onSubmit={(e) => { e.preventDefault(); handleInvite('send_email') }}
            className="mt-4 flex max-w-[640px] gap-2"
          >
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              disabled={inviting || !email.trim()}
            >
              <Mail className="mr-1.5 h-4 w-4" />
              Send Email
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={inviting || !email.trim()}
              onClick={() => handleInvite('copy_link')}
            >
              <Link2 className="mr-1.5 h-4 w-4" />
              Copy Link
            </Button>
          </form>
        )}

        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="group flex items-center gap-3 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-card)] px-4 py-3"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-active)] text-xs font-medium text-[var(--text-body)]">
                {getInitials(m)}
              </div>

              {/* Name + email */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-secondary)]">
                  {m.full_name ?? m.user_email ?? m.user_id}
                </p>
                {m.full_name && m.user_email && (
                  <p className="truncate text-xs text-[var(--text-muted)]">{m.user_email}</p>
                )}
              </div>

              {/* Role badge */}
              <span className={
                m.role === 'owner' || m.role === 'admin'
                  ? 'rounded-md bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--accent-primary)]'
                  : 'rounded-md bg-[var(--surface-active)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--text-body)]'
              }>
                {m.role}
              </span>

              {/* Status for pending */}
              {m.status === 'pending' && (
                <span className="rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                  Pending
                </span>
              )}

              {/* Actions */}
              {m.role !== 'owner' && (
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
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
                </div>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No members yet.</p>
          )}
        </div>
      </section>

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
