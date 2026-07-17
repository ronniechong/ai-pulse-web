import { useMemo, useState } from 'react'
import type { EChartsOption } from 'echarts'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useEcharts } from '@/hooks/useEcharts'
import { CHART_COL, FONT_MONO, FONT_SANS, deltaColor, lerpColor } from '@/lib/tokens'
import { useFormatters } from '@/lib/useFormatters'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'
import type { ProviderShare as ProviderShareEntry } from '@/lib/types'

type Window = 'd1' | 'd7' | 'd30'

const WINDOW_LABEL: Record<Window, string> = { d1: 'Δ1d', d7: 'Δ7d', d30: 'Δ30d' }

function deltaFor(p: ProviderShareEntry, window: Window): number | null {
  if (window === 'd1') return p.delta_1d
  if (window === 'd7') return p.delta_7d
  return p.delta_30d
}

export function ProviderShare() {
  const { facts, factsLoading: loading } = useDashboardData()
  const { pct, decimal, decimalDelta, deltaPct } = useFormatters()
  const [window, setWindow] = useState<Window>('d1')
  const shares = facts?.rankings.provider_share ?? []
  const hhi = facts?.rankings.concentration
  const maxShare = Math.max(1e-9, ...shares.map((p) => p.token_share_today))

  const option: EChartsOption = useMemo(
    () => ({
      // Small tiles hide their in-box label (not enough room to fit text
      // without overflowing) — the tooltip is the only way to identify
      // those providers/values at all, not just a hover nicety.
      tooltip: {
        // Neither params.name nor params.data is trustworthy here — ECharts'
        // treemap layout mutates the node's value internally (for its own
        // squarified-layout math) in a way that leaks into both. dataIndex
        // still reliably maps back to our own `shares` array in order, so
        // look the real values up there instead of trusting what ECharts
        // hands back.
        formatter: (params) => {
          const i = (params as { dataIndex?: number }).dataIndex
          const p = i != null ? shares[i] : undefined
          if (!p) return ''
          const delta = deltaFor(p, window)
          // This tooltip is a real DOM element (not canvas), so raw oklch
          // via deltaColor() is fine here — the browser parses it natively;
          // CHART_COL's rgb-resolved variants are only needed inside actual
          // chart option colors (see tokens.ts).
          return `${p.provider}: ${pct(p.token_share_today)}<br/>${WINDOW_LABEL[window]}: <span style="color:${deltaColor(delta)}">${deltaPct(delta)}</span>`
        },
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: (p) => `{name|${p.name}}\n{pct|${pct(Number(p.value))}}`,
            // Tile background ranges from near-dark (small shares) to
            // bright accent-blue (the top provider) — a single fixed text
            // color can't stay legible across that whole range, so both
            // labels get a soft dark shadow/halo regardless of what's
            // underneath. Also bumped `pct` off CHART_COL.muted, which
            // was unreadable against the brightest tiles.
            rich: {
              name: {
                fontFamily: FONT_SANS,
                fontSize: 11.5,
                color: CHART_COL.text,
                lineHeight: 16,
                textShadowColor: 'rgba(0, 0, 0, 0.55)',
                textShadowBlur: 4,
              },
              pct: {
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.82)',
                lineHeight: 14,
                textShadowColor: 'rgba(0, 0, 0, 0.55)',
                textShadowBlur: 4,
              },
            },
          },
          itemStyle: { borderColor: CHART_COL.panel, borderWidth: 2, gapWidth: 2 },
          levels: [{ itemStyle: { borderColor: CHART_COL.panel, borderWidth: 2, gapWidth: 2 } }],
          // Color intensity is a second encoding of the same value the box
          // area already represents — computed per node (not ECharts' own
          // colorMappingBy, which cycles through unrelated hues instead of
          // shading smoothly) so the biggest provider is visually obvious
          // at a glance, not just "the biggest rectangle" among identically
          // -shaded ones. Momentum (the Δ toggle) is tooltip-only, not a
          // tile encoding — see the formatter above.
          data: shares.map((p) => ({
            name: p.provider,
            value: p.token_share_today,
            itemStyle: { color: lerpColor(CHART_COL.panel2, CHART_COL.accent, p.token_share_today / maxShare) },
          })),
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shares, window],
  )

  const ref = useEcharts(option, [shares, window], loading && shares.length === 0)

  return (
    // flex-1 stretches this to match RankingsTable's height (its sibling in
    // the same row) in the common case, but RankingsTable can grow a lot
    // (the "show all 50 models" toggle) — max-h caps how far this panel
    // stretches with it, so the treemap doesn't turn into a handful of
    // absurdly tall, thin slivers when the sibling is much taller than a
    // treemap actually wants to be.
    <div className="flex max-h-[630px] min-w-[380px] flex-1 flex-col rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Provider share</span>
        <div className="flex flex-wrap items-center gap-2">
          {hhi?.hhi_today != null && (
            <span className="rounded-full bg-[var(--pulse-panel2)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--pulse-muted)]">
              Concentration: HHI {decimal(hhi.hhi_today)}
              {hhi.hhi_delta_30d != null && ` · ${decimalDelta(hhi.hhi_delta_30d)} vs 30d`}
            </span>
          )}
          <div className="flex gap-1">
            {(Object.keys(WINDOW_LABEL) as Window[]).map((w) => (
              <Button
                key={w}
                size="sm"
                variant={window === w ? 'default' : 'outline'}
                className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
                onClick={() => {
                  setWindow(w)
                  trackEvent(`provider-share-window-${w}`)
                }}
              >
                {WINDOW_LABEL[w]}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="relative min-h-[190px] max-h-[560px] w-full flex-1">
        <div ref={ref} className="h-full w-full" />
        {!loading && shares.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
            No provider-share data yet.
          </div>
        )}
      </div>
      {shares.length > 0 && (
        <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
          Tile size &amp; fill = today&apos;s share · hover a tile for {WINDOW_LABEL[window]} momentum
        </div>
      )}
    </div>
  )
}
