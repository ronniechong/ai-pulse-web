import { useMemo, useState } from 'react'
import type { EChartsOption } from 'echarts'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useEcharts } from '@/hooks/useEcharts'
import { useFormatters } from '@/lib/useFormatters'
import { REGION_COL } from '@/lib/tokens'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'
import type { SdkGeoTrendPoint } from '@/lib/types'

const REGIONS = Object.keys(REGION_COL)

function buildPackageOptions(points: SdkGeoTrendPoint[]): { key: string; label: string }[] {
  const seen = new Map<string, string>()
  for (const p of points) if (!seen.has(p.package)) seen.set(p.package, p.provider)
  return [...seen.entries()].map(([key, label]) => ({ key, label }))
}

function buildSeries(points: SdkGeoTrendPoint[], selectedPackage: string) {
  const filtered = points.filter((p) => p.package === selectedPackage)
  const dates = [...new Set(filtered.map((p) => p.date))].sort()
  const byRegion = new Map<string, Map<string, number>>()
  for (const p of filtered) {
    if (!byRegion.has(p.region)) byRegion.set(p.region, new Map())
    byRegion.get(p.region)!.set(p.date, p.downloads)
  }
  return { dates, byRegion }
}

export function SdkGeoTrendPanel() {
  const { sdkGeoTrend, sdkGeoTrendLoading: loading } = useDashboardData()
  const { compact, date } = useFormatters()
  const points = sdkGeoTrend?.series ?? []
  const packageOptions = useMemo(() => buildPackageOptions(points), [points])
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const activePackage = selectedPackage ?? packageOptions[0]?.key ?? ''
  const [hiddenRegions, setHiddenRegions] = useState<Set<string>>(new Set())

  const { dates, byRegion } = useMemo(() => buildSeries(points, activePackage), [points, activePackage])

  const toggleRegion = (region: string) => {
    setHiddenRegions((prev) => {
      const next = new Set(prev)
      if (next.has(region)) next.delete(region)
      else next.add(region)
      return next
    })
    trackEvent(`sdk-geo-trend-region-toggle-${region}`)
  }

  const option: EChartsOption = useMemo(
    () => ({
      grid: { left: 48, right: 16, top: 12, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          // 'cross' shows a floating label on BOTH axes, and shares this one
          // formatter across them — without branching on axisDimension, the
          // y-axis's raw downloads number gets fed through date(), which
          // renders "Invalid Date".
          label: {
            formatter: (p) =>
              (p as { axisDimension?: string }).axisDimension === 'y' ? compact(Number(p.value)) : date(String(p.value)),
          },
        },
        formatter: (params) => {
          const list = Array.isArray(params) ? params : [params]
          if (list.length === 0) return ''
          const header = date(String((list[0] as { axisValue?: string }).axisValue))
          const rows = list
            .filter((p) => p.value != null)
            .sort((a, b) => Number(b.value) - Number(a.value))
            .map((p) => `${p.marker} ${p.seriesName}: ${compact(Number(p.value))}`)
            .join('<br/>')
          return `${header}<br/>${rows}`
        },
      },
      xAxis: { type: 'category', data: dates, axisLabel: { formatter: (d: string) => date(d) } },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => compact(v) } },
      series: REGIONS.filter((region) => !hiddenRegions.has(region)).map((region) => ({
        name: region,
        type: 'line',
        showSymbol: false,
        lineStyle: { width: 2, color: REGION_COL[region] },
        itemStyle: { color: REGION_COL[region] },
        data: dates.map((d) => byRegion.get(region)?.get(d) ?? null),
        connectNulls: true,
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dates, byRegion, hiddenRegions],
  )

  // ref must stay attached to a permanently-mounted div — useEcharts' mount
  // effect (`[]` deps) runs exactly once and needs containerRef.current set
  // on that very first render. Swapping to a different JSX branch (e.g. a
  // loading-skeleton early-return) while data is still in flight means the
  // ref never attaches on mount, echarts.init() never runs, and the chart
  // stays permanently blank even after data arrives — same trap the hook's
  // own doc comment warns about. Use ECharts' native showLoading() (via the
  // last arg here) instead, same as ProviderShare/RacingBar.
  const ref = useEcharts(option, [dates, byRegion, hiddenRegions], loading && points.length === 0)

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">SDK downloads by region</span>
        <div className="flex flex-wrap gap-1">
          {packageOptions.map((pkg) => (
            <Button
              key={pkg.key}
              size="sm"
              variant={pkg.key === activePackage ? 'default' : 'outline'}
              className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
              onClick={() => {
                setSelectedPackage(pkg.key)
                trackEvent(`sdk-geo-trend-package-${pkg.key}`)
              }}
            >
              {pkg.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative h-[220px] w-full">
        <div ref={ref} className="h-full w-full" />
        {!loading && dates.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
            No trend data yet.
          </div>
        )}
      </div>

      {dates.length > 0 && (
        // Direct-labeled legend, not ECharts' own — matches this app's
        // other panels, and doubles as the required secondary encoding for
        // a categorical palette whose worst adjacent CVD pair sits in the
        // 8-12 floor band (see tokens.ts REGION_COL). Also click-to-toggle:
        // filtering happens in React state (`hiddenRegions`) rather than via
        // ECharts' own legend component, so the accessible label styling
        // stays exactly this custom markup.
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {REGIONS.map((region) => {
            const hidden = hiddenRegions.has(region)
            return (
              <button
                key={region}
                type="button"
                aria-pressed={!hidden}
                onClick={() => toggleRegion(region)}
                className="flex items-center gap-1.5 font-mono text-[10.5px] text-[var(--pulse-muted)] transition-opacity hover:opacity-80"
                style={{ opacity: hidden ? 0.4 : 1 }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: REGION_COL[region] }}
                  aria-hidden
                />
                <span className={hidden ? 'line-through' : undefined}>{region}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
        PyPI SDK installs via ClickPy, summed per region · these 8 regions don&apos;t cover the whole world (no Oceania/Pacific
        bucket) · daily from {dates[0] ? date(dates[0]) : '—'}
      </div>
    </div>
  )
}
