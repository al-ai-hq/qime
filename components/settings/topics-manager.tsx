'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Topic } from '@/lib/types'

export function TopicsManager({ orgId, topics }: { orgId: string; topics: Topic[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function addTopic(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await api.topics.create(orgId, { name: newName.trim() })
      setNewName('')
      setShowInput(false)
      toast.success('Topic added')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAdding(false)
    }
  }

  async function deleteTopic(id: string) {
    setDeleting(id)
    try {
      await api.topics.delete(orgId, id)
      toast.success('Topic deleted')
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
        <h2 className="text-base font-semibold text-[var(--text-secondary)]">Topics</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          onClick={() => setShowInput(true)}
        >
          + Add Topic
        </Button>
      </div>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Categorize prompts by topic</p>

      {showInput && (
        <form onSubmit={addTopic} className="mt-4 flex max-w-[640px] gap-2">
          <Input
            placeholder="New topic name"
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
        {topics.map((topic) => (
          <span
            key={topic.id}
            className="flex items-center gap-1 rounded-md bg-[var(--accent-muted)] px-2.5 py-1 text-xs text-[var(--text-body)]"
          >
            <span dir="auto">{topic.name}</span>
            <button
              type="button"
              disabled={deleting === topic.id}
              onClick={() => deleteTopic(topic.id)}
              className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {topics.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">No topics yet.</p>
        )}
      </div>
    </section>
  )
}
