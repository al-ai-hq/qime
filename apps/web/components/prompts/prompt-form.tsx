'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Prompt, Topic, Tag } from '@/lib/types'

interface PromptFormProps {
  orgId: string
  topics: Topic[]
  tags: Tag[]
  prompt?: Prompt
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'every_other_day', label: 'Every other day' },
]

export function PromptForm({ orgId, topics, tags, prompt }: PromptFormProps) {
  const router = useRouter()
  const isEdit = !!prompt
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(prompt?.title ?? '')
  const [promptText, setPromptText] = useState(prompt?.prompt_text ?? '')
  const [topicId, setTopicId] = useState(prompt?.topic_id ?? '')
  const [frequency, setFrequency] = useState(prompt?.run_frequency_override ?? '')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(prompt?.prompt_tags?.map((pt) => pt.tag_id) ?? [])
  )

  function toggleTag(tagId: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        title,
        prompt_text: promptText,
        topic_id: topicId || undefined,
        run_frequency_override: frequency || null,
        tag_ids: Array.from(selectedTags),
      }
      if (isEdit) {
        await api.prompts.update(orgId, prompt.id, body)
        toast.success('Prompt updated')
      } else {
        await api.prompts.create(orgId, body)
        toast.success('Prompt created')
      }
      router.push(`/${orgId}/prompts`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save prompt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Best CRM software"
          required
          maxLength={50}
          dir="auto"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prompt_text">Prompt text</Label>
        <Textarea
          id="prompt_text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="What would you ask an AI about your brand?"
          required
          rows={4}
          dir="auto"
        />
      </div>
      {topics.length > 0 && (
        <div className="space-y-2">
          <Label>Topic</Label>
          <Select value={topicId} onValueChange={setTopicId}>
            <SelectTrigger>
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label>Run frequency override</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger>
            <SelectValue placeholder="Use org default" />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTags.has(tag.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'hover:bg-accent'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update prompt' : 'Create prompt'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
