import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { PanelSkeleton } from '@/components/PanelSkeleton'

const TONE_LABEL: Record<string, string> = { big_day: 'BIG DAY', notable: 'NOTABLE', quiet: 'QUIET' }
const TONE_ORDER = ['quiet', 'notable', 'big_day'] as const

export function AiTransparencyPanel() {
  const { aiTransparency, aiTransparencyLoading: loading } = useDashboardData()
  const { pct, seconds, currency, wholeNumber } = useFormatters()

  if (loading && !aiTransparency) return <PanelSkeleton height={160} />
  if (!aiTransparency) return null

  const { llm_reliability: reliability, tone_distribution: tone, spend, eval_suite: evalSuite, window_days } =
    aiTransparency
  const evalsHealthy = evalSuite.failed === 0

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">
          AI-engineering transparency
        </div>
        <div
          className={`flex items-center gap-1.5 font-mono text-[11px] ${evalsHealthy ? 'text-[var(--pulse-up)]' : 'text-[var(--pulse-down)]'}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${evalsHealthy ? 'bg-[var(--pulse-up)]' : 'bg-[var(--pulse-down)]'}`} />
          {evalSuite.passed}/{evalSuite.total} eval fixtures passing
        </div>
      </div>
      <p className="mb-3 font-sans text-[13px] leading-[1.6] text-[var(--pulse-muted)]">
        How the commentary pipeline actually behaved over the trailing {window_days} days — traced
        via Langfuse, not self-reported.
      </p>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded border border-[var(--pulse-border)] p-2 text-center">
          <div className="font-mono text-[15px] font-semibold text-[var(--pulse-text)]">
            {reliability.success_rate !== null ? pct(reliability.success_rate, 0) : '—'}
          </div>
          <div className="font-sans text-[11px] text-[var(--pulse-muted)]">LLM success rate</div>
        </div>
        <div className="rounded border border-[var(--pulse-border)] p-2 text-center">
          <div className="font-mono text-[15px] font-semibold text-[var(--pulse-text)]">
            {reliability.avg_latency_ms !== null ? seconds(reliability.avg_latency_ms) : '—'}
          </div>
          <div className="font-sans text-[11px] text-[var(--pulse-muted)]">Avg call latency</div>
        </div>
        <div className="rounded border border-[var(--pulse-border)] p-2 text-center">
          <div className="font-mono text-[15px] font-semibold text-[var(--pulse-text)]">
            {currency(spend.month_to_date_usd)}
          </div>
          <div className="font-sans text-[11px] text-[var(--pulse-muted)]">Spend, month-to-date</div>
        </div>
      </div>

      <div className="mb-3 font-sans text-[11px] text-[var(--pulse-muted)]">
        Lifetime: {currency(spend.lifetime_usd)} across {wholeNumber(spend.lifetime_calls)} generation
        {spend.lifetime_calls === 1 ? '' : 's'}
        {spend.cost_per_generation_usd !== null && <> ({currency(spend.cost_per_generation_usd, 4)}/generation)</>}
      </div>

      <div className="mb-1 font-sans text-[11px] text-[var(--pulse-muted)]">
        Tone over {tone.days_checked} tracked day{tone.days_checked === 1 ? '' : 's'}
      </div>
      <div className="flex gap-3 font-mono text-[12px] text-[var(--pulse-text)]">
        {TONE_ORDER.map((t) => (
          <span key={t}>
            {TONE_LABEL[t]} <span className="text-[var(--pulse-muted)]">{wholeNumber(tone[t])}</span>
          </span>
        ))}
      </div>

      <p className="mt-3 font-sans text-[11.5px] leading-[1.5] text-[var(--pulse-muted)]">
        &quot;Success rate&quot; is per call attempt, not per day — a retried attempt after a
        rejected LLM response counts separately from the day&apos;s final outcome. {reliability.fallback_count}{' '}
        of {reliability.attempts_checked} attempts fell back to the deterministic template.
      </p>
    </div>
  )
}
