'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
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
  const [alternateNames, setAlternateNames] = useState<string[]>([])
  const [newAltName, setNewAltName] = useState('')

  useEffect(() => {
    if (open) {
      setName(competitor?.name ?? '')
      setWebsite(competitor?.website ?? '')
      setAlternateNames(competitor?.alternate_names ?? [])
      setNewAltName('')
    }
  }, [open, competitor])

  function addAlternateName() {
    const trimmed = newAltName.trim()
    if (!trimmed) return
    if (alternateNames.includes(trimmed)) {
      toast.error('This name is already added')
      return
    }
    setAlternateNames([...alternateNames, trimmed])
    setNewAltName('')
  }

  function removeAlternateName(index: number) {
    setAlternateNames(alternateNames.filter((_, i) => i !== index))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.competitors.update(orgId, competitor.id, {
          name,
          website: website || undefined,
          alternate_names: alternateNames,
        })
        toast.success('Competitor updated')
      } else {
        await api.competitors.create(orgId, {
          name,
          website: website || undefined,
          alternate_names: alternateNames.length > 0 ? alternateNames : undefined,
        })
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
          <div className="space-y-2">
            <Label htmlFor="comp-alt-name">Alternate names</Label>
            <p className="text-sm text-muted-foreground">
              Name in other languages for AI response detection
            </p>
            <div className="flex gap-2">
              <Input
                id="comp-alt-name"
                value={newAltName}
                onChange={(e) => setNewAltName(e.target.value)}
                placeholder="e.g. 삼성, サムスン"
                dir="auto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAlternateName()
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addAlternateName}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {alternateNames.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {alternateNames.map((altName, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
                  >
                    {altName}
                    <button
                      type="button"
                      onClick={() => removeAlternateName(i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
