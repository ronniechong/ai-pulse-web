import { useState } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { Button } from '@/components/ui/button'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { trackEvent } from '@/lib/analytics'
import type { AppRow } from '@/lib/types'

type Tab = 'all' | 'coding' | 'cli-agent'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'coding', label: 'Coding' },
  { key: 'cli-agent', label: 'CLI agent' },
]

type Metric = 'tokens' | 'requests'

const METRIC_LABEL: Record<Metric, string> = { tokens: 'Tokens', requests: 'Requests' }

function valueFor(app: AppRow, metric: Metric): number {
  return metric === 'tokens' ? app.total_tokens : app.total_requests
}

export function AppsLeaderboard() {
  const { apps, appsLoading: loading } = useDashboardData()
  const { compact, wholeNumber } = useFormatters()
  const [tab, setTab] = useState<Tab>('all')
  const [metric, setMetric] = useState<Metric>('tokens')

  // Ranking by requests instead of tokens surfaces genuinely different
  // apps — a high-request/low-token app is many small interactions (a
  // chat UI), a low-request/high-token app is few huge jobs (a batch/agent
  // integration) — so this re-sorts rather than reusing apps.json's own
  // (tokens-based) `rank` field.
  const rows = (apps?.apps ?? [])
    .filter((a) => tab === 'all' || (a.categories ?? []).includes(tab))
    .sort((a, b) => valueFor(b, metric) - valueFor(a, metric))
  const maxValue = Math.max(1, ...rows.map((a) => valueFor(a, metric)))

  if (loading && rows.length === 0) return <PanelSkeleton height={160} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Apps leaderboard</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <Button
                key={t.key}
                size="sm"
                variant={tab === t.key ? 'default' : 'outline'}
                className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
                onClick={() => {
                  setTab(t.key)
                  trackEvent(`apps-tab-${t.key}`)
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
          {/* Divider — without it, this button group and the category tabs
              to its left read as one continuous row of 5 options instead
              of two separate controls (category filter vs. ranking
              metric), especially with both groups' active state using the
              same highlight color. */}
          <div className="h-5 w-px bg-[var(--pulse-border)]" aria-hidden />
          <div className="flex gap-1">
            {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={metric === m ? 'default' : 'outline'}
                className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
                onClick={() => {
                  setMetric(m)
                  trackEvent(`apps-metric-${m}`)
                }}
              >
                {METRIC_LABEL[m]}
              </Button>
            ))}
          </div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
          No apps in this category today.
        </div>
      ) : (
        <>
          {rows.slice(0, 8).map((a, i) => (
            <div
              key={a.app_id}
              className="grid min-h-[34px] grid-cols-[28px_1fr_150px] items-center gap-2.5 border-b border-[var(--pulse-border)]"
            >
              <span className="font-mono text-[11.5px] text-[var(--pulse-faint)]">{i + 1}</span>
              <span className="font-sans text-[13px] text-[var(--pulse-text)]">{a.app_name}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="flex cursor-help items-center gap-2">
                    <span className="h-1.5 min-w-[50px] flex-1 overflow-hidden rounded-full bg-[var(--pulse-border)]">
                      <span
                        className="block h-full rounded-full bg-[var(--pulse-accent)]"
                        style={{ width: `${(valueFor(a, metric) / maxValue) * 100}%` }}
                      />
                    </span>
                    <span className="w-[48px] text-right font-mono text-[11px] text-[var(--pulse-muted)]">
                      {compact(valueFor(a, metric))}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] font-sans text-[11.5px] leading-snug" side="top">
                  <AppTooltipContent app={a} wholeNumber={wholeNumber} compact={compact} />
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
          <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
            Ranked by total {metric === 'tokens' ? 'token volume' : 'request count'} routed through OpenRouter that
            day — not user count or installs. Switching Tokens/Requests can reorder the list: a
            high-request/low-token app is many small interactions (a chat UI), a low-request/high-token app is few
            huge jobs (a batch or agent integration) — see each app&apos;s avg tokens/request in the tooltip. Bar
            width is relative to the top app in this tab, not a share of all traffic. Category tagging (Coding/CLI
            agent) only covers a subset of apps on a typical day — untagged apps only show under &quot;All&quot;.
          </div>
        </>
      )}
    </div>
  )
}

function AppTooltipContent({
  app,
  wholeNumber,
  compact,
}: {
  app: AppRow
  wholeNumber: (v: number) => string
  compact: (v: number) => string
}) {
  return (
    <div className="space-y-1">
      <div className="font-semibold">{app.app_name}</div>
      <div>Tokens rank #{app.rank}</div>
      <div>{wholeNumber(app.total_tokens)} tokens</div>
      <div>{wholeNumber(app.total_requests)} requests</div>
      <div>~{compact(app.total_tokens / app.total_requests)} tokens/request</div>
      {app.categories.length > 0 && <div className="pt-0.5 opacity-80">{app.categories.join(', ')}</div>}
    </div>
  )
}
