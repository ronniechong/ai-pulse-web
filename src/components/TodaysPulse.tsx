import { useMemo } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { deltaColor } from '@/lib/tokens'
import { formatModelName } from '@/lib/format'
import { useFormatters } from '@/lib/useFormatters'
import type { Mover } from '@/lib/types'

const TONE_LABEL: Record<string, string> = { big_day: 'BIG DAY', notable: 'NOTABLE', quiet: 'QUIET' }

function topMover(movers: Mover[]): Mover | null {
  const withDelta = movers.filter((m) => m.rank_delta_1d !== null)
  if (withDelta.length === 0) return null
  return withDelta.reduce((best, m) => (Math.abs(m.rank_delta_1d!) > Math.abs(best.rank_delta_1d!) ? m : best))
}

export function TodaysPulse() {
  const { rankings, facts, commentary } = useDashboardData()
  const { deltaRank, pct } = useFormatters()

  const mover = useMemo(() => (facts ? topMover(facts.rankings.movers) : null), [facts])
  const entrant = facts?.rankings.new_entrants[0] ?? null
  const record = facts?.rankings.records[0] ?? null
  const hasCards = Boolean(mover || entrant || record)

  const heroStrip = rankings?.models.slice(0, 10) ?? []
  const moverByModel = new Map((facts?.rankings.movers ?? []).map((m) => [m.model, m]))

  if (!commentary || !rankings) {
    return (
      <section id="pulse" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
        <div className="mb-3.5 font-mono text-[11px] font-semibold tracking-[.06em] text-[var(--pulse-faint)]">
          TODAY&apos;S PULSE
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-2/3 rounded bg-[var(--pulse-panel2)]" />
          <div className="h-4 w-full max-w-[720px] rounded bg-[var(--pulse-panel2)]" />
        </div>
      </section>
    )
  }

  return (
    <section id="pulse" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
      <div className="mb-3.5 font-mono text-[11px] font-semibold tracking-[.06em] text-[var(--pulse-faint)]">
        TODAY&apos;S PULSE
      </div>

      <div className="mb-4 border-l-[3px] border-[var(--pulse-accent)] pl-3.5">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="rounded font-mono text-[10px] font-semibold tracking-[.03em]"
            style={{
              padding: '2px 6px',
              border: `1px solid ${commentary.tone === 'quiet' ? 'var(--pulse-border)' : 'var(--pulse-accent)'}`,
              color: commentary.tone === 'quiet' ? 'var(--pulse-muted)' : 'var(--pulse-accent)',
            }}
          >
            {TONE_LABEL[commentary.tone] ?? commentary.tone.toUpperCase()}
          </span>
          <span className="font-sans text-[10px] text-[var(--pulse-faint)]">
            AI-generated · <a href="#about-methodology" className="text-[var(--pulse-accent)] underline">about</a>
          </span>
        </div>
        <div className="mb-1.5 font-sans text-[23px] font-semibold leading-[1.3] text-[var(--pulse-text)]">
          {commentary.headline}
        </div>
        <div className="max-w-[720px] font-sans text-[13px] leading-[1.55] text-[var(--pulse-muted)]">
          {commentary.summary}
        </div>
      </div>

      {hasCards ? (
        <div className="mb-4 flex flex-wrap gap-3.5">
          {mover && (
            <StatCard
              label="TOP MOVER"
              model={formatModelName(mover.model)}
              detail={`#${mover.rank_today + (mover.rank_delta_1d ?? 0)} → #${mover.rank_today} · Δ7d ${deltaRank(mover.rank_delta_7d)}`}
            />
          )}
          {entrant && (
            <StatCard
              label="NEW ENTRANT"
              model={formatModelName(entrant.model)}
              detail={`Debuts at #${entrant.rank}`}
            />
          )}
          {record && (
            <StatCard
              label="RECORD"
              model={formatModelName(record.model)}
              detail={`${record.type === 'first_time_rank1' ? 'First time #1' : 'Highest single-day share'}: ${pct(record.value)}`}
            />
          )}
        </div>
      ) : (
        <div className="mb-4 font-sans text-[13px] italic text-[var(--pulse-faint)]">
          No standout signals today — quiet day, no stat cards.
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {heroStrip.map((r) => {
          const m = moverByModel.get(r.model)
          return (
            <div
              key={r.model}
              className="flex flex-none items-center gap-1.5 rounded-full border border-[var(--pulse-border)] bg-[var(--pulse-panel2)] px-2.5 py-1"
            >
              <span className="font-mono text-[11.5px] font-semibold text-[var(--pulse-faint)]">{r.rank}</span>
              <span className="whitespace-nowrap font-sans text-[11.5px] text-[var(--pulse-text)]">
                {formatModelName(r.model)}
              </span>
              <span className="font-mono text-[11px]" style={{ color: deltaColor(m?.rank_delta_1d) }}>
                {deltaRank(m?.rank_delta_1d)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StatCard({ label, model, detail }: { label: string; model: string; detail: string }) {
  return (
    <div className="min-w-[180px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel2)] p-3">
      <div className="mb-1 font-mono text-[9.5px] font-semibold tracking-[.04em] text-[var(--pulse-faint)]">
        {label}
      </div>
      <div className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">{model}</div>
      <div className="mt-0.5 font-mono text-[11.5px] text-[var(--pulse-muted)]">{detail}</div>
    </div>
  )
}
