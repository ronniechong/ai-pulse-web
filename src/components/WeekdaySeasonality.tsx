import { useMemo } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { deltaColor } from '@/lib/tokens'
import { computeDayOfWeekVolume, type DayOfWeekVolume } from '@/lib/seasonality'

// Mon..Sun for display — computeDayOfWeekVolume itself uses JS's own
// 0=Sun..6=Sat (Date#getUTCDay()) internally.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DOW_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeekdaySeasonality() {
  const { rankingsDailyTotals, rankingsDailyTotalsLoading: loading } = useDashboardData()
  const { relativePct } = useFormatters()

  const byDow = useMemo(() => {
    const computed = rankingsDailyTotals ? computeDayOfWeekVolume(rankingsDailyTotals.rows) : []
    const map = new Map<number, DayOfWeekVolume>(computed.map((d) => [d.dow, d]))
    return DISPLAY_ORDER.map((dow) => map.get(dow)).filter((d): d is DayOfWeekVolume => d != null)
  }, [rankingsDailyTotals])

  const maxAvg = Math.max(1, ...byDow.map((d) => d.avgTotalTokens))

  if (loading && byDow.length === 0) return <PanelSkeleton height={220} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Usage by day of week</span>
        <span className="font-mono text-[10.5px] text-[var(--pulse-faint)]">avg daily volume, full history</span>
      </div>
      {byDow.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
          Not enough history yet.
        </div>
      ) : (
        byDow.map((d) => (
          <div key={d.dow} className="grid min-h-[30px] grid-cols-[40px_1fr_60px] items-center gap-2.5">
            <span className="font-mono text-[11.5px] text-[var(--pulse-muted)]">{DOW_LABEL[d.dow]}</span>
            <span className="h-2 min-w-[40px] overflow-hidden rounded-full bg-[var(--pulse-border)]">
              <span
                className="block h-full rounded-full bg-[var(--pulse-accent)]"
                style={{ width: `${(d.avgTotalTokens / maxAvg) * 100}%` }}
              />
            </span>
            <span className="text-right font-mono text-[11px]" style={{ color: deltaColor(d.deltaVsOverall) }}>
              {relativePct(d.deltaVsOverall)}
            </span>
          </div>
        ))
      )}
      <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
        % vs. the overall daily average across all tracked days. Naive day-of-week average, not detrended against the
        platform&apos;s own growth over the tracked window — a documented simplification, not a seasonally-adjusted
        figure.
      </div>
    </div>
  )
}
