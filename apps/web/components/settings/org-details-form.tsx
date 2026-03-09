'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Organization } from '@/lib/types'

export function OrgDetailsForm({ orgId, org }: { orgId: string; org: Organization | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(org?.name ?? '')
  const [website, setWebsite] = useState(org?.website ?? '')
  const [description, setDescription] = useState(org?.description ?? '')
  const [alternateNames, setAlternateNames] = useState<string[]>(org?.alternate_names ?? [])
  const [newAltName, setNewAltName] = useState('')

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
      await api.orgs.update(orgId, {
        name,
        website: website || undefined,
        description: description || undefined,
        alternate_names: alternateNames,
      })
      toast.success('Organization updated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organization details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required dir="auto" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-alt-name">Alternate names</Label>
            <p className="text-sm text-muted-foreground">
              Name in other languages for AI response detection
            </p>
            <div className="flex gap-2">
              <Input
                id="org-alt-name"
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
          <div className="space-y-2">
            <Label htmlFor="org-website">Website</Label>
            <Input id="org-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc">Description</Label>
            <Textarea id="org-desc" value={description} onChange={(e) => setDescription(e.target.value)} dir="auto" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
