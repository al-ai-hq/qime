'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Tag } from '@/lib/types'

export function TagsManager({ orgId, tags }: { orgId: string; tags: Tag[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function addTag(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await api.tags.create(orgId, { name: newName.trim() })
      setNewName('')
      setShowInput(false)
      toast.success('Tag added')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAdding(false)
    }
  }

  async function deleteTag(id: string) {
    setDeleting(id)
    try {
      await api.tags.delete(orgId, id)
      toast.success('Tag deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section>
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-[var(--text-secondary)]">Tags</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          onClick={() => setShowInput(true)}
        >
          + Add Tag
        </Button>
      </div>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Organize prompts with tags</p>

      {showInput && (
        <form onSubmit={addTag} className="mt-4 flex max-w-[640px] gap-2">
          <Input
            placeholder="New tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            dir="auto"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={adding}>
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setShowInput(false); setNewName('') }}>
            Cancel
          </Button>
        </form>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-md bg-[var(--accent-muted)] px-2.5 py-1 text-xs text-[var(--text-body)]"
          >
            <span dir="auto">{tag.name}</span>
            <button
              type="button"
              disabled={deleting === tag.id}
              onClick={() => deleteTag(tag.id)}
              className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">No tags yet.</p>
        )}
      </div>
    </section>
  )
}
