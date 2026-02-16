'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Competitor } from '@/lib/types'

interface CompetitorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  competitor?: Competitor
}

export function CompetitorForm({ open, onOpenChange, orgId, competitor }: CompetitorFormProps) {
  const router = useRouter()
  const isEdit = !!competitor
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    if (open) {
      setName(competitor?.name ?? '')
      setWebsite(competitor?.website ?? '')
    }
  }, [open, competitor])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.competitors.update(orgId, competitor.id, { name, website: website || undefined })
        toast.success('Competitor updated')
      } else {
        await api.competitors.create(orgId, { name, website: website || undefined })
        toast.success('Competitor added')
      }
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit competitor' : 'Add competitor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comp-name">Name</Label>
            <Input
              id="comp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Competitor name"
              required
              dir="auto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comp-website">Website</Label>
            <Input
              id="comp-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://competitor.com"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
