import { useMemo } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { formatModelName } from '@/lib/format'
import { computeRankVolatility } from '@/lib/volatility'

const DISPLAY_COUNT = 8

export function RankVolatility() {
  const { rankingsHistory, rankingsHistoryLoading: loading } = useDashboardData()
  const { decimal } = useFormatters()

  const rows = useMemo(
    () => (rankingsHistory ? computeRankVolatility(rankingsHistory.rows).slice(0, DISPLAY_COUNT) : []),
    [rankingsHistory],
  )

  if (loading && rows.length === 0) return <PanelSkeleton height={280} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Most volatile rankings</span>
        <span className="font-mono text-[10.5px] text-[var(--pulse-faint)]">full history, min 30 days</span>
      </div>
      {rows.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
          Not enough history yet.
        </div>
      ) : (
        rows.map((r, i) => (
          <div
            key={r.model}
            className="flex min-h-[34px] items-center justify-between gap-2 border-b border-[var(--pulse-border)]"
          >
            <span className="font-mono text-[11.5px] text-[var(--pulse-faint)]">{i + 1}</span>
            <span className="flex-1 truncate font-sans text-[13px] text-[var(--pulse-text)]">
              {formatModelName(r.model)}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-[var(--pulse-muted)]">
              #{r.minRank}–{r.maxRank} · σ {decimal(r.stdev, 1)}
            </span>
          </div>
        ))
      )}
      <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
        σ = standard deviation of a model&apos;s daily rank across its full history — higher means it bounces around
        the leaderboard more, not just a recent swing. #min–max shows the actual range it has spanned. A model needs
        30+ tracked days to appear here, so brand-new entrants don&apos;t dominate on a couple of noisy data points.
      </div>
    </div>
  )
}
