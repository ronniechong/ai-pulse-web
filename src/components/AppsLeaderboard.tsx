import { useState } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { Button } from '@/components/ui/button'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AppRow } from '@/lib/types'

type Tab = 'all' | 'coding' | 'cli-agent'

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'coding', label: 'Coding' },
  { key: 'cli-agent', label: 'CLI agent' },
]

export function AppsLeaderboard() {
  const { apps, loading } = useDashboardData()
  const { compact, wholeNumber } = useFormatters()
  const [tab, setTab] = useState<Tab>('all')

  const rows = (apps?.apps ?? []).filter((a) => tab === 'all' || (a.categories ?? []).includes(tab))
  const maxTokens = Math.max(1, ...rows.map((a) => a.total_tokens))

  if (loading && rows.length === 0) return <PanelSkeleton height={160} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Apps leaderboard</span>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={tab === t.key ? 'default' : 'outline'}
              className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
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
                        style={{ width: `${(a.total_tokens / maxTokens) * 100}%` }}
                      />
                    </span>
                    <span className="w-[48px] text-right font-mono text-[11px] text-[var(--pulse-muted)]">
                      {compact(a.total_tokens)}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] font-sans text-[11.5px] leading-snug" side="top">
                  <AppTooltipContent app={a} wholeNumber={wholeNumber} />
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
          <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
            Ranked by total token volume routed through OpenRouter that day — not user count or installs. A single
            high-throughput integration can outrank a broadly-used app. Bar width is relative to the top app in this
            tab, not a share of all traffic.
          </div>
        </>
      )}
    </div>
  )
}

function AppTooltipContent({
  app,
  wholeNumber,
}: {
  app: AppRow
  wholeNumber: (v: number) => string
}) {
  return (
    <div className="space-y-1">
      <div className="font-semibold">{app.app_name}</div>
      <div>Rank #{app.rank}</div>
      <div>{wholeNumber(app.total_tokens)} tokens</div>
      <div>{wholeNumber(app.total_requests)} requests</div>
      {app.categories.length > 0 && <div className="pt-0.5 opacity-80">{app.categories.join(', ')}</div>}
    </div>
  )
}
