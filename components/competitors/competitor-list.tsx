'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
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
        <PageHeader title="Competitors" />
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No competitors yet"
          description="Add competitors to track how they appear alongside your brand in AI responses."
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Competitor
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
      <PageHeader
        title="Competitors"
        action={
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Competitor
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {competitors.map((c) => (
          <div
            key={c.id}
            className="group relative rounded-xl border border-[var(--border-primary)] bg-[var(--surface-card)] p-5 transition-all duration-150 hover:bg-[var(--hover-surface)]"
          >
            {/* Hover action buttons */}
            <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Card content */}
            <h3 className="text-base font-semibold text-[var(--text-secondary)]">{c.name}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {c.website || <span className="text-[var(--text-hint)]">No website</span>}
            </p>
            {c.alternate_names && c.alternate_names.length > 0 && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {c.alternate_names.join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>

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
