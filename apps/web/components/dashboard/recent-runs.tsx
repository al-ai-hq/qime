import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Run {
  id: string
  prompt_id: string
  platform_id: string
  visibility_score: number
  brand_mentioned: boolean
  brand_cited: boolean
  created_at: string
  prompts?: { title: string } | null
}

export function RecentRuns({ runs, orgId }: { runs: Run[]; orgId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Runs</CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No runs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Mentioned</TableHead>
                <TableHead>Cited</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Link
                      href={`/${orgId}/prompts/${run.prompt_id}`}
                      className="font-medium hover:underline"
                    >
                      {run.prompts?.title ?? 'Untitled'}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{run.platform_id}</TableCell>
                  <TableCell>
                    <Badge variant={run.visibility_score >= 50 ? 'default' : 'secondary'}>
                      {Math.round(run.visibility_score)}
                    </Badge>
                  </TableCell>
                  <TableCell>{run.brand_mentioned ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{run.brand_cited ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
