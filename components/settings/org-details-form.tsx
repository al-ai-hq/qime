'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
    <section>
      <h2 className="text-base font-semibold text-[var(--text-secondary)]">General</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Organization details and branding</p>
      <form onSubmit={onSubmit} className="mt-4 max-w-[640px] space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-[var(--text-body)]">Name</Label>
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required dir="auto" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-alt-name" className="text-[var(--text-body)]">Alternate names</Label>
          <p className="text-sm text-[var(--text-muted)]">
            Name in other languages for AI response detection
          </p>
          <div className="flex gap-2">
            <Input
              id="org-alt-name"
              value={newAltName}
              onChange={(e) => setNewAltName(e.target.value)}
              placeholder="e.g. Samsung, Sony"
              dir="auto"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addAlternateName()
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addAlternateName}>
              Add
            </Button>
          </div>
          {alternateNames.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {alternateNames.map((altName, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-md bg-[var(--accent-muted)] px-2.5 py-1 text-xs text-[var(--text-body)]"
                >
                  {altName}
                  <button
                    type="button"
                    onClick={() => removeAlternateName(i)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-website" className="text-[var(--text-body)]">Website</Label>
          <Input id="org-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-desc" className="text-[var(--text-body)]">Description</Label>
          <Textarea id="org-desc" value={description} onChange={(e) => setDescription(e.target.value)} dir="auto" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </section>
  )
}
