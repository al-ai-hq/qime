import { Skeleton } from '@/components/ui/skeleton'

export default function PromptsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-64" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-md" />
      ))}
    </div>
  )
}
