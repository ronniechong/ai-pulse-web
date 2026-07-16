import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { PanelSkeleton } from '@/components/PanelSkeleton'

export function HFTrending() {
  const { hfTrending, loading } = useDashboardData()
  const { compact } = useFormatters()
  const rows = hfTrending?.models.slice(0, 6) ?? []

  if (loading && rows.length === 0) return <PanelSkeleton height={140} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">HF trending</span>
        <span className="font-mono text-[10.5px] text-[var(--pulse-faint)]">
          7d velocity · open weights · last 30 days
        </span>
      </div>
      {rows.length === 0 ? (
        <div className="flex h-[140px] items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
          No trending data yet.
        </div>
      ) : (
        rows.map((h) => (
          <div
            key={h.id}
            className="flex min-h-[32px] items-center justify-between border-b border-[var(--pulse-border)]"
          >
            <span className="font-sans text-[13px] text-[var(--pulse-text)]">{h.id}</span>
            <span className="font-mono text-xs text-[var(--pulse-up)]">+{compact(h.downloads)}</span>
          </div>
        ))
      )}
      <div className="mt-2 font-sans text-[10.5px] italic text-[var(--pulse-faint)]">
        Now signal only — no history, no time-travel (HF API is rolling-window).
      </div>
    </div>
  )
}
