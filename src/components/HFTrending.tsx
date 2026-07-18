import { useMemo, useState } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'
import type { HFModel } from '@/lib/types'

const DISPLAY_COUNT = 6
const MAX_TAG_FILTERS = 4

// HF's pipeline_tag is an open-ended taxonomy (dozens of possible values),
// unlike apps.json's fixed 4-category OpenRouter taxonomy — so the filter
// options are built from whichever tags actually appear in today's top 50,
// most-frequent first, rather than a hardcoded list. Capped so the filter
// row doesn't overwhelm this small panel; "All" still shows everything,
// long-tail tags included.
function buildTagOptions(models: HFModel[]): string[] {
  const counts = new Map<string, number>()
  for (const m of models) {
    if (!m.pipeline_tag) continue
    counts.set(m.pipeline_tag, (counts.get(m.pipeline_tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TAG_FILTERS)
    .map(([tag]) => tag)
}

export function HFTrending() {
  const { hfTrending, hfTrendingLoading: loading } = useDashboardData()
  const { compact } = useFormatters()
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const allModels = hfTrending?.models ?? []
  const tagOptions = useMemo(() => buildTagOptions(allModels), [allModels])
  const rows = (tagFilter ? allModels.filter((m) => m.pipeline_tag === tagFilter) : allModels).slice(0, DISPLAY_COUNT)

  if (loading && allModels.length === 0) return <PanelSkeleton height={140} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">HF trending</span>
        <span className="font-mono text-[10.5px] text-[var(--pulse-faint)]">
          7d velocity · open weights · last 30 days
        </span>
      </div>
      {tagOptions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={tagFilter === null ? 'default' : 'outline'}
            className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
            onClick={() => {
              setTagFilter(null)
              trackEvent('hf-tag-all')
            }}
          >
            All
          </Button>
          {tagOptions.map((tag) => (
            <Button
              key={tag}
              size="sm"
              variant={tagFilter === tag ? 'default' : 'outline'}
              className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
              onClick={() => {
                setTagFilter(tag)
                trackEvent(`hf-tag-${tag}`)
              }}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <div className="flex h-[140px] items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
          No trending models in this task right now.
        </div>
      ) : (
        rows.map((h) => (
          <div
            key={h.id}
            className="flex min-h-[38px] items-center justify-between gap-2 border-b border-[var(--pulse-border)] py-1"
          >
            <div className="min-w-0">
              <div className="truncate font-sans text-[13px] text-[var(--pulse-text)]">{h.id}</div>
              {(h.pipeline_tag || h.library_name) && (
                <div className="truncate font-mono text-[10px] text-[var(--pulse-faint)]">
                  {[h.pipeline_tag, h.library_name].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <span className="shrink-0 font-mono text-xs text-[var(--pulse-up)]">+{compact(h.downloads)}</span>
          </div>
        ))
      )}
      <div className="mt-2 font-sans text-[10.5px] italic text-[var(--pulse-faint)]">
        Now signal only — no history, no time-travel (HF API is rolling-window). Task/library shown per model where
        HF reports it.
      </div>
    </div>
  )
}
