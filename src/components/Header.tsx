import { useEffect, useState } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function Header() {
  const { manifest } = useDashboardData()
  const { relativeTime, dateTime } = useFormatters()

  // DashboardDataProvider's poll skips setState when data_version is
  // unchanged (the common case between pipeline runs), so nothing forces
  // this component to re-render on its own — relativeTime() would freeze
  // at whatever it read on the last real render instead of ticking forward.
  // A local timer, independent of the data poll, keeps it live.
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])
  const sources = manifest ? Object.values(manifest.sources) : []
  const degraded = sources.filter((s) => s.status === 'degraded')
  const isDegraded = degraded.length > 0

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--pulse-border)] bg-[var(--pulse-bg)]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3.5">
        <div className="flex items-baseline gap-2.5">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--pulse-accent)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--pulse-accent)]" />
          </span>
          <span className="font-sans text-base font-bold text-[var(--pulse-text)]">AI Pulse</span>
          <span className="font-sans text-xs text-[var(--pulse-faint)]">Global AI model usage, daily</span>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: isDegraded ? 'var(--pulse-amber)' : 'var(--pulse-up)' }}
            />
            {manifest ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help font-mono text-[11.5px] text-[var(--pulse-muted)]" tabIndex={0}>
                    {`Data as of ${relativeTime(manifest.generated_at)}`}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="font-sans text-[11.5px] leading-snug" side="bottom">
                  Last scheduled update: {dateTime(manifest.generated_at)}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="font-mono text-[11.5px] text-[var(--pulse-muted)]">Loading…</span>
            )}
          </div>
        </div>
      </div>
      {isDegraded && (
        <div className="mx-auto max-w-[1200px] border-l-2 border-[var(--pulse-amber)] bg-[var(--pulse-amber-soft)] px-6 py-2 font-sans text-xs text-[var(--pulse-text)]">
          Degraded: {degraded.length === 1 ? '1 source' : `${degraded.length} sources`} unavailable (
          {degraded
            .map((s) => s.error)
            .filter(Boolean)
            .join('; ') || 'showing last-good data'}
          ). Other panels are unaffected.
        </div>
      )}
    </header>
  )
}
