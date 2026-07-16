import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useEcharts } from '@/hooks/useEcharts'
import { COL, FONT_MONO, FONT_SANS } from '@/lib/tokens'
import { useFormatters } from '@/lib/useFormatters'

export function ProviderShare() {
  const { facts, loading } = useDashboardData()
  const { pct, decimal, decimalDelta } = useFormatters()
  const shares = facts?.rankings.provider_share ?? []
  const hhi = facts?.rankings.concentration

  const option: EChartsOption = useMemo(
    () => ({
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: (p) => `{name|${p.name}}\n{pct|${pct(Number(p.value))}}`,
            rich: {
              name: { fontFamily: FONT_SANS, fontSize: 11.5, color: COL.text, lineHeight: 16 },
              pct: { fontFamily: FONT_MONO, fontSize: 11, color: COL.muted, lineHeight: 14 },
            },
          },
          itemStyle: { borderColor: COL.panel, borderWidth: 2, gapWidth: 2 },
          levels: [{ itemStyle: { borderColor: COL.panel, borderWidth: 2, gapWidth: 2 } }],
          data: shares.map((p) => ({
            name: p.provider,
            value: p.token_share_today,
            itemStyle: { color: COL.panel2 },
          })),
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shares],
  )

  const ref = useEcharts(option, [shares], loading && shares.length === 0)

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Provider share</span>
        {hhi?.hhi_today != null && (
          <span className="rounded-full bg-[var(--pulse-panel2)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--pulse-muted)]">
            Concentration: HHI {decimal(hhi.hhi_today)}
            {hhi.hhi_delta_30d != null && ` · ${decimalDelta(hhi.hhi_delta_30d)} vs 30d`}
          </span>
        )}
      </div>
      <div className="relative h-[190px] w-full">
        <div ref={ref} className="h-full w-full" />
        {!loading && shares.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
            No provider-share data yet.
          </div>
        )}
      </div>
    </div>
  )
}
