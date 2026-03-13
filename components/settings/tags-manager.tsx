'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Tag } from '@/lib/types'

export function TagsManager({ orgId, tags }: { orgId: string; tags: Tag[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function addTag(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await api.tags.create(orgId, { name: newName.trim() })
      setNewName('')
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addTag} className="flex max-w-md gap-2">
          <Input
            placeholder="New tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            dir="auto"
          />
          <Button type="submit" size="sm" disabled={adding} className="gap-1">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1 rounded-full border px-3 py-1">
              <span className="text-sm" dir="auto">{tag.name}</span>
              <button
                type="button"
                disabled={deleting === tag.id}
                onClick={() => deleteTag(tag.id)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
