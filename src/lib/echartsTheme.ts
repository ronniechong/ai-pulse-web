// Generated once from lib/tokens.ts COL — the single source of truth for
// both the Tailwind theme (index.css) and this ECharts theme (locked stack
// decision: design tokens as CSS variables generating the ECharts theme).
import { COL, FONT_MONO } from './tokens'

export const PULSE_ECHARTS_THEME = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: FONT_MONO, color: COL.muted },
  color: [COL.accent, COL.up, COL.down, COL.amber, COL.faint],
  categoryAxis: {
    axisLine: { lineStyle: { color: COL.border } },
    axisLabel: { color: COL.muted, fontFamily: FONT_MONO, fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisLabel: { color: COL.faint, fontFamily: FONT_MONO, fontSize: 11 },
    splitLine: { lineStyle: { color: COL.border, type: 'dashed' as const } },
  },
  tooltip: {
    backgroundColor: COL.panel2,
    borderColor: COL.border,
    textStyle: { color: COL.text, fontFamily: FONT_MONO, fontSize: 12 },
  },
}
