// Design tokens ported verbatim from the chosen Claude Design canvas
// (AI Pulse Dashboard.dc.html, Component.COL) — single source of truth for
// both the Tailwind theme (src/index.css) and the generated ECharts theme
// (src/lib/echartsTheme.ts). The design is dark-only, no light variant was
// authored, so this app renders dark-only by design, not by omission.
export const COL = {
  bg: 'oklch(16% 0.012 255)',
  panel: 'oklch(20% 0.013 255)',
  panel2: 'oklch(25% 0.014 255)',
  border: 'oklch(32% 0.015 255)',
  text: 'oklch(94% 0.004 255)',
  muted: 'oklch(68% 0.01 255)',
  faint: 'oklch(50% 0.012 255)',
  accent: 'oklch(68% 0.16 248)',
  accentSoft: 'oklch(68% 0.16 248 / 0.16)',
  up: 'oklch(70% 0.16 148)',
  down: 'oklch(64% 0.20 25)',
  amber: 'oklch(76% 0.14 80)',
  amberSoft: 'oklch(76% 0.14 80 / 0.14)',
} as const

export const FONT_SANS = "'Space Grotesk Variable', -apple-system, Helvetica, Arial, sans-serif"
export const FONT_MONO = 'ui-monospace, Menlo, monospace'

export function deltaColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return COL.faint
  return value > 0 ? COL.up : COL.down
}

// Number/percent/date formatting lives in lib/useFormatters.ts (FormatJS) —
// this module only owns visual tokens (colors, fonts).
