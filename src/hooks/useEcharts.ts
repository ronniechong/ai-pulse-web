// Thin wrapper hook around ECharts — deliberately not echarts-for-react
// (locked stack decision, see work-docs: removes a dependency, and this is
// the entire integration surface we need). Owns instance lifecycle
// (init/dispose/resize) and option updates; callers just pass an option.
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { PULSE_ECHARTS_THEME } from '@/lib/echartsTheme'
import { COL, FONT_MONO } from '@/lib/tokens'

echarts.registerTheme('pulse', PULSE_ECHARTS_THEME)

const LOADING_OPTION = {
  text: '',
  color: COL.accent,
  textColor: COL.muted,
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
export function useEcharts(option: echarts.EChartsOption, deps: unknown[], loading = false) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = echarts.init(containerRef.current, 'pulse')
    chartRef.current = chart

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
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
