// Thin wrapper hook around ECharts — deliberately not echarts-for-react
// (locked stack decision, see work-docs: removes a dependency, and this is
// the entire integration surface we need). Owns instance lifecycle
// (init/dispose/resize) and option updates; callers just pass an option.
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, TreemapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption, ECharts } from 'echarts'
import { PULSE_ECHARTS_THEME } from '@/lib/echartsTheme'
import { CHART_COL, FONT_MONO } from '@/lib/tokens'

// Only the chart/component types the two chart panels (RacingBar's bar
// chart, ProviderShare's treemap) actually use — importing full `echarts`
// pulled in every chart type and inflated the bundle by ~1MB. TooltipComponent
// is needed for ProviderShare's treemap tooltip (small tiles hide their
// label but still need a way to surface their name/value on hover).
echarts.use([BarChart, TreemapChart, GridComponent, TooltipComponent, CanvasRenderer])
echarts.registerTheme('pulse', PULSE_ECHARTS_THEME)

const LOADING_OPTION = {
  text: '',
  color: CHART_COL.accent,
  textColor: CHART_COL.muted,
  maskColor: 'transparent',
  fontSize: 12,
  fontFamily: FONT_MONO,
  showSpinner: true,
  spinnerRadius: 8,
  lineWidth: 2,
}

/** loading uses ECharts' own showLoading/hideLoading — the chart <div> stays
 * permanently mounted (unlike a React-level skeleton swap, which would
 * detach the ref the one-time init effect depends on and the chart would
 * never come back). */
export function useEcharts(option: EChartsOption, deps: unknown[], loading = false) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = echarts.init(containerRef.current, 'pulse')
    chartRef.current = chart

    // ResizeObserver (not just window resize) — this container can change
    // size from CSS layout alone, e.g. stretching to match a sibling
    // panel's height when that panel's own content grows/shrinks, with no
    // window resize event involved at all.
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (loading) {
      chartRef.current?.showLoading('default', LOADING_OPTION)
    } else {
      chartRef.current?.hideLoading()
      chartRef.current?.setOption(option, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ...deps])

  return containerRef
}
