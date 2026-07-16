import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { buildSparklines } from '@/lib/sparkline'
import { deltaColor } from '@/lib/tokens'
import { formatModelName } from '@/lib/format'
import { useFormatters } from '@/lib/useFormatters'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Mover, RankingModel } from '@/lib/types'

type Window = 'd1' | 'd7' | 'd30'

const WINDOW_LABEL: Record<Window, string> = { d1: 'Δ1d', d7: 'Δ7d', d30: 'Δ30d' }

const DEFAULT_VISIBLE_ROWS = 10

const TOKEN_SHARE_EXPLAINER =
  "Each model's share of total token volume OpenRouter routed that day — its tokens ÷ all tracked models' tokens (top 50 + Other). Based on token counts, not requests or dollars, and each provider counts tokens with its own tokenizer, so shares aren't perfectly apples-to-apples across providers."

const DELTA_EXPLAINER =
  'Change in rank position versus the selected window. Green means the model moved up the leaderboard, red means it dropped. Shown as — when there’s not yet enough history to compute that window.'

function deltaFor(mover: Mover | undefined, window: Window): number | null {
  if (!mover) return null
  if (window === 'd1') return mover.rank_delta_1d
  if (window === 'd7') return mover.rank_delta_7d
  return mover.rank_delta_30d
}

function HeaderHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex cursor-help align-middle" tabIndex={0}>
        <Info className="h-2.5 w-2.5 text-[var(--pulse-faint)]" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] font-sans text-[11.5px] leading-snug">{text}</TooltipContent>
    </Tooltip>
  )
}

/** Wraps a row's token-share bar so hovering it surfaces the exact token
 * count and other row metadata that doesn't otherwise fit in the compact
 * bar+percentage display. */
function TokenShareTrigger({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex flex-1 cursor-help items-center gap-2" tabIndex={0}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] font-sans text-[11.5px] leading-snug" side="top">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

function RowTooltipContent({
  r,
  mover,
  wholeNumber,
  pct,
  deltaRank,
}: {
  r: RankingModel
  mover: Mover | undefined
  wholeNumber: (v: number) => string
  pct: (v: number, digits?: number) => string
  deltaRank: (v: number | null | undefined) => string
}) {
  return (
    <div className="space-y-1">
      <div className="font-semibold">{formatModelName(r.model)}</div>
      <div>
        Rank #{r.rank}
        {mover ? ` · ${mover.provider}` : ''}
      </div>
      <div>
        {wholeNumber(r.total_tokens)} tokens · {pct(r.token_share)} of daily volume
      </div>
      {mover && (
        <div className="pt-0.5 opacity-80">
          Δ1d {deltaRank(mover.rank_delta_1d)} · Δ7d {deltaRank(mover.rank_delta_7d)} · Δ30d{' '}
          {deltaRank(mover.rank_delta_30d)}
        </div>
      )}
    </div>
  )
}

export function RankingsTable() {
  const { rankings, facts, rankingsHistory } = useDashboardData()
  const { deltaRank, pct, wholeNumber } = useFormatters()
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState<string | null>(null)
  const [window, setWindow] = useState<Window>('d1')
  const [expanded, setExpanded] = useState(false)

  const sparklines = useMemo(() => (rankingsHistory ? buildSparklines(rankingsHistory.rows) : new Map()), [rankingsHistory])
  const moverByModel = useMemo(() => new Map((facts?.rankings.movers ?? []).map((m) => [m.model, m])), [facts])

  const providers = useMemo(() => {
    const ps = facts?.rankings.provider_share ?? []
    return [...ps].sort((a, b) => b.token_share_today - a.token_share_today).slice(0, 3).map((p) => p.provider)
  }, [facts])

  if (!rankings) return <TablePanelSkeleton />

  const otherRow = rankings.models.find((m) => m.model === 'other')
  const rows = rankings.models.filter((m) => m.model !== 'other')

  const filtered = rows.filter((r) => {
    const mover = moverByModel.get(r.model)
    const name = formatModelName(r.model)
    const provider = mover?.provider ?? ''
    if (providerFilter && provider !== providerFilter) return false
    if (search && !name.toLowerCase().includes(search.toLowerCase()) && !provider.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    return true
  })

  // A search or provider filter already narrows the list to something the
  // user is deliberately looking for — the top-N cap only applies to the
  // default, unfiltered view where most of the panel's height was going to
  // rows nobody was reading (Provider share next to it is a fraction of
  // the height).
  const isFiltering = search.trim() !== '' || providerFilter !== null
  const canToggle = !isFiltering && filtered.length > DEFAULT_VISIBLE_ROWS
  const visibleRows = isFiltering || expanded ? filtered : filtered.slice(0, DEFAULT_VISIBLE_ROWS)

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <Input
          placeholder="Search models or providers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[200px] border-[var(--pulse-border)] bg-[var(--pulse-panel2)] font-sans text-[11.5px] text-[var(--pulse-text)]"
        />
        <div className="flex flex-1 gap-1.5">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setProviderFilter(providerFilter === p ? null : p)}
              className="rounded-full border px-2.5 py-0.5 font-sans text-[10.5px]"
              style={{
                borderColor: 'var(--pulse-border)',
                background: providerFilter === p ? 'var(--pulse-accent)' : 'var(--pulse-panel2)',
                color: providerFilter === p ? 'var(--pulse-bg)' : 'var(--pulse-muted)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['d1', 'd7', 'd30'] as const).map((w) => (
            <Button
              key={w}
              size="sm"
              variant={window === w ? 'default' : 'outline'}
              className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
              onClick={() => setWindow(w)}
            >
              {WINDOW_LABEL[w]}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--pulse-border)] py-7 text-center font-sans text-[13px] text-[var(--pulse-faint)]">
          No models match this filter.
        </div>
      ) : (
        <>
          {/* Desktop/tablet: fixed-column grid with sparklines. */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[28px_1.6fr_110px_1.2fr_70px_60px] items-center gap-2.5 border-b border-[var(--pulse-border)] px-1 py-1.5 font-mono text-[9.5px] font-semibold text-[var(--pulse-faint)]">
              <span>#</span>
              <span>Model</span>
              <span>Provider</span>
              <span className="flex items-center gap-1">
                Token share
                <HeaderHint text={TOKEN_SHARE_EXPLAINER} />
              </span>
              <span className="text-center">30d</span>
              <span className="flex items-center justify-end gap-1">
                <HeaderHint text={DELTA_EXPLAINER} />
                Δ
              </span>
            </div>
            {visibleRows.map((r) => {
              const mover = moverByModel.get(r.model)
              const spark = sparklines.get(r.model)
              const delta = deltaFor(mover, window)
              return (
                <div
                  key={r.model}
                  className="grid min-h-[40px] grid-cols-[28px_1.6fr_110px_1.2fr_70px_60px] items-center gap-2.5 border-b border-[var(--pulse-border)] px-1"
                >
                  <span className="font-mono text-[11.5px] text-[var(--pulse-faint)]">{r.rank}</span>
                  <span className="font-sans text-[13px] text-[var(--pulse-text)]">{formatModelName(r.model)}</span>
                  <span className="w-fit rounded bg-[var(--pulse-panel2)] px-1.5 py-0.5 font-sans text-[11.5px] text-[var(--pulse-muted)]">
                    {mover?.provider ?? '—'}
                  </span>
                  <TokenShareTrigger
                    content={<RowTooltipContent r={r} mover={mover} wholeNumber={wholeNumber} pct={pct} deltaRank={deltaRank} />}
                  >
                    <span className="h-1.5 min-w-[50px] flex-1 overflow-hidden rounded-full bg-[var(--pulse-border)]">
                      <span
                        className="block h-full rounded-full bg-[var(--pulse-accent)]"
                        style={{ width: `${Math.min(100, r.token_share * 100 * 5)}%` }}
                      />
                    </span>
                    <span className="w-[42px] text-right font-mono text-[11.5px] text-[var(--pulse-muted)]">
                      {pct(r.token_share)}
                    </span>
                  </TokenShareTrigger>
                  <span className="flex justify-center">
                    <svg width="64" height="24" viewBox="0 0 64 24">
                      {spark && (
                        <path d={spark.path} fill="none" stroke={sparkColor(spark.direction)} strokeWidth="1.6" />
                      )}
                    </svg>
                  </span>
                  <span className="text-right font-mono text-[12px]" style={{ color: deltaColor(delta) }}>
                    {deltaRank(delta)}
                  </span>
                </div>
              )
            })}
            {otherRow && !providerFilter && !search && (
              <div className="grid min-h-[40px] grid-cols-[28px_1.6fr_110px_1.2fr_70px_60px] items-center gap-2.5 px-1">
                <span className="font-mono text-[11.5px] text-[var(--pulse-faint)]">—</span>
                <span className="font-sans text-[13px] italic text-[var(--pulse-faint)]">Other (unranked models)</span>
                <span />
                <TokenShareTrigger
                  content={
                    <div className="space-y-1">
                      <div className="font-semibold">Other (unranked models)</div>
                      <div>
                        {wholeNumber(otherRow.total_tokens)} tokens · {pct(otherRow.token_share)} of daily volume
                      </div>
                      <div className="pt-0.5 opacity-80">Aggregate of every model outside the top 50 — no per-model breakdown available.</div>
                    </div>
                  }
                >
                  <span className="h-1.5 min-w-[50px] flex-1 overflow-hidden rounded-full bg-[var(--pulse-border)]">
                    <span
                      className="block h-full rounded-full opacity-40"
                      style={{ width: `${otherRow.token_share * 100}%`, background: 'var(--pulse-faint)' }}
                    />
                  </span>
                  <span className="w-[42px] text-right font-mono text-[11.5px] text-[var(--pulse-muted)]">
                    {pct(otherRow.token_share)}
                  </span>
                </TokenShareTrigger>
                <span />
                <span />
              </div>
            )}
          </div>

          {/* Mobile: stacked cards, no sparkline column (too narrow to read),
              same pattern GeoPanel uses for its own mobile fallback. */}
          <div className="sm:hidden">
            {visibleRows.map((r) => {
              const mover = moverByModel.get(r.model)
              const delta = deltaFor(mover, window)
              return (
                <div key={r.model} className="border-b border-[var(--pulse-border)] py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-baseline gap-1.5">
                      <span className="font-mono text-[11px] text-[var(--pulse-faint)]">{r.rank}</span>
                      <span className="truncate font-sans text-[13px] text-[var(--pulse-text)]">
                        {formatModelName(r.model)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded bg-[var(--pulse-panel2)] px-1.5 py-0.5 font-sans text-[10.5px] text-[var(--pulse-muted)]">
                      {mover?.provider ?? '—'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <TokenShareTrigger
                      content={<RowTooltipContent r={r} mover={mover} wholeNumber={wholeNumber} pct={pct} deltaRank={deltaRank} />}
                    >
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--pulse-border)]">
                        <span
                          className="block h-full rounded-full bg-[var(--pulse-accent)]"
                          style={{ width: `${Math.min(100, r.token_share * 100 * 5)}%` }}
                        />
                      </span>
                      <span className="font-mono text-[11px] text-[var(--pulse-muted)]">{pct(r.token_share)}</span>
                    </TokenShareTrigger>
                    <span className="font-mono text-[11px]" style={{ color: deltaColor(delta) }}>
                      {WINDOW_LABEL[window]} {deltaRank(delta)}
                    </span>
                  </div>
                </div>
              )
            })}
            {otherRow && !providerFilter && !search && (
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="font-sans text-[13px] italic text-[var(--pulse-faint)]">Other (unranked models)</span>
                <span className="font-mono text-[11px] text-[var(--pulse-muted)]">{pct(otherRow.token_share)}</span>
              </div>
            )}
          </div>

          {canToggle && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 w-full rounded py-2 text-center font-mono text-[11px] text-[var(--pulse-muted)] hover:text-[var(--pulse-text)]"
            >
              {expanded ? `Show top ${DEFAULT_VISIBLE_ROWS} only` : `Show all ${filtered.length} models`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function sparkColor(direction: string): string {
  if (direction === 'up') return 'var(--pulse-up)'
  if (direction === 'down') return 'var(--pulse-down)'
  if (direction === 'volatile') return 'var(--pulse-accent)'
  return 'var(--pulse-faint)'
}

function TablePanelSkeleton() {
  return (
    <div className="min-w-[380px] flex-1 animate-pulse rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="h-40 rounded bg-[var(--pulse-panel2)]" />
    </div>
  )
}
