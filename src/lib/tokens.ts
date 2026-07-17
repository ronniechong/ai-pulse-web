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

/** Resolves any CSS color (including oklch()) to a plain rgb()/rgba()
 * string via a canvas pixel readback. Needed because zrender (ECharts'
 * renderer) has its own color parser that doesn't understand oklch() —
 * passing it directly works for a flat fill (the string reaches canvas as
 * a raw fillStyle, which browsers do parse) but breaks anything that needs
 * zrender to *compute* a variant of the color, e.g. the default hover/
 * emphasis highlight, which comes out black or invisible. getComputedStyle
 * isn't reliable for this: modern Chrome echoes wide-gamut colors back in
 * their original notation (still oklch(), just re-serialized) instead of
 * converting to rgb() — a canvas 2D context always resolves fillStyle to
 * concrete 8-bit sRGB bytes on readback, which is what we actually need.
 * Chart option colors should always go through this; DOM/Tailwind styles
 * shouldn't, since the browser already parses oklch() natively there. */
function toRgb(cssColor: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = cssColor
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
}

/** COL, pre-resolved to rgb()/rgba() — use this (never COL directly) inside
 * ECharts theme/option objects. See toRgb() for why. */
export const CHART_COL = Object.fromEntries(Object.entries(COL).map(([k, v]) => [k, toRgb(v)])) as typeof COL

/** Linearly interpolates between two CHART_COL-style rgb()/rgba() strings.
 * ECharts treemap's own `colorMappingBy: 'value'` doesn't produce a clean
 * two-stop gradient in practice — sibling nodes get assigned noticeably
 * different hues instead of shading smoothly, so charts that want a real
 * value-driven color ramp compute it themselves per node with this instead
 * of leaning on the treemap's built-in coloring. */
export function lerpColor(from: string, to: string, t: number): string {
  const clamped = Math.min(1, Math.max(0, t))
  const parse = (c: string) => c.match(/[\d.]+/g)!.map(Number)
  const [r1, g1, b1] = parse(from)
  const [r2, g2, b2] = parse(to)
  const mix = (a: number, b: number) => Math.round(a + (b - a) * clamped)
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`
}

/** Categorical palette for the 8 world regions (SDK-downloads trend chart).
 * Already concrete hex (not oklch), so unlike COL these go straight into
 * ECharts series colors without toRgb() — zrender parses hex natively.
 * Validated with the dataviz skill's six-check validator against this
 * app's actual dark panel surface (#12161c): lightness band, chroma floor,
 * and contrast all pass; worst adjacent CVD ΔE is 10.3 (protan), the
 * 8-12 "floor" band that's legal only with secondary encoding — hence the
 * trend chart always pairs this with a legend + tooltip, never color
 * alone. Slot order is the CVD-safety mechanism, not cosmetic; don't
 * reorder without re-running the validator. */
export const REGION_COL: Record<string, string> = {
  'North America': '#3987e5',
  Europe: '#199e70',
  'East Asia': '#c98500',
  'South Asia': '#008300',
  'SE Asia': '#9085e9',
  'Middle East': '#e66767',
  'Latin America': '#d55181',
  Africa: '#d95926',
}

// Number/percent/date formatting lives in lib/useFormatters.ts (FormatJS) —
// this module only owns visual tokens (colors, fonts).
