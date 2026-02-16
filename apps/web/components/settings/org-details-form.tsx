'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.orgs.update(orgId, { name, website: website || undefined, description: description || undefined })
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
