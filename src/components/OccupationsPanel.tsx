import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const DISPLAY_COUNT = 8

export function OccupationsPanel() {
  const { occupations, occupationsLoading: loading } = useDashboardData()
  const { pct, date } = useFormatters()
  const rows = occupations?.occupations.slice(0, DISPLAY_COUNT) ?? []

  if (loading && rows.length === 0) return <PanelSkeleton height={160} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-1 font-sans text-[13px] font-semibold text-[var(--pulse-text)]">
        Occupations · usage &amp; automation split
      </div>
      {occupations && (
        <div className="mb-3 font-mono text-[10.5px] text-[var(--pulse-faint)]">
          Vintage: Economic Index {date(occupations.period.start)}..{date(occupations.period.end)} · static between
          quarterly releases
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
          No occupation data yet.
        </div>
      ) : (
        <>
          {rows.map((o) => {
            const auto = o.automation_pct ?? 0
            const aug = o.augmentation_pct ?? 0
            return (
              <div key={o.soc_code} className="mb-2 grid grid-cols-[150px_1fr_90px] items-center gap-2.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      className="cursor-help overflow-hidden text-ellipsis whitespace-nowrap text-left font-sans text-xs text-[var(--pulse-text)]"
                    >
                      {o.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] font-sans text-[11.5px] leading-snug">
                    {o.name}
                  </TooltipContent>
                </Tooltip>
                <span className="flex h-3.5 overflow-hidden rounded bg-[var(--pulse-border)]">
                  <span style={{ width: `${auto}%`, background: 'var(--pulse-faint)', opacity: 0.55 }} />
                  <span style={{ width: `${aug}%`, background: 'var(--pulse-accent)' }} />
                </span>
                <span className="text-right font-mono text-[11px] text-[var(--pulse-muted)]">
                  {pct(auto / 100, 0)} / {pct(aug / 100, 0)}
                </span>
              </div>
            )
          })}
          <div className="mt-2 flex gap-3.5">
            <span className="font-sans text-[10.5px] text-[var(--pulse-faint)]">■ automation</span>
            <span className="font-sans text-[10.5px] text-[var(--pulse-accent)]">■ augmentation</span>
          </div>
        </>
      )}
    </div>
  )
}
