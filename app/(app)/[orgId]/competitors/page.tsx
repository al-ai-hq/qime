import { createClient } from '@/lib/supabase/server'
import { CompetitorList } from '@/components/competitors/competitor-list'

export const metadata = { title: 'Competitors - Qime' }

export default async function CompetitorsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await createClient()

  const { data: competitors } = await supabase
    .from('competitors')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <CompetitorList competitors={competitors ?? []} orgId={orgId} />
    </div>
  )
}
