'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CompetitorForm } from '@/components/competitors/competitor-form'
import type { Competitor } from '@/lib/types'

export function CompetitorList({ competitors, orgId }: { competitors: Competitor[]; orgId: string }) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Competitor | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(c: Competitor) {
    setEditing(c)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.competitors.delete(orgId, deleteTarget.id)
      toast.success('Competitor deleted')
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (competitors.length === 0 && !formOpen) {
    return (
      <>
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No competitors yet"
          description="Add competitors to track how they appear alongside your brand in AI responses."
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add competitor
            </Button>
          }
        />
        <CompetitorForm
          open={formOpen}
          onOpenChange={setFormOpen}
          orgId={orgId}
          competitor={editing}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add competitor
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Alternate names</TableHead>
            <TableHead>Website</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitors.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {c.alternate_names && c.alternate_names.length > 0
                  ? c.alternate_names.join(', ')
                  : '--'}
              </TableCell>
              <TableCell className="text-muted-foreground">{c.website || '--'}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CompetitorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        orgId={orgId}
        competitor={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete competitor"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
