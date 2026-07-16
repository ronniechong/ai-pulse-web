import { Skeleton } from '@/components/ui/skeleton'

/** Shared loading state for panels while the initial (or a refresh) fetch
 * is in flight — distinct from each panel's "no data" empty state, which
 * only renders once loading is confirmed false. */
export function PanelSkeleton({ height = 190 }: { height?: number }) {
  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <Skeleton className="mb-3 h-4 w-1/3 bg-[var(--pulse-panel2)]" />
      <Skeleton className="w-full bg-[var(--pulse-panel2)]" style={{ height }} />
    </div>
  )
}
