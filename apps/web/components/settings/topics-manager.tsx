'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Topic } from '@/lib/types'

export function TopicsManager({ orgId, topics }: { orgId: string; topics: Topic[] }) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function addTopic(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await api.topics.create(orgId, { name: newName.trim() })
      setNewName('')
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addTopic} className="flex max-w-md gap-2">
          <Input
            placeholder="New topic name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            dir="auto"
          />
          <Button type="submit" size="sm" disabled={adding} className="gap-1">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
        <div className="space-y-2">
          {topics.map((topic) => (
            <div key={topic.id} className="flex max-w-md items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm" dir="auto">{topic.name}</span>
              <Button
                variant="ghost"
                size="icon"
                disabled={deleting === topic.id}
                onClick={() => deleteTopic(topic.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {topics.length === 0 && (
            <p className="text-sm text-muted-foreground">No topics yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
