import type { RankingsHistoryRow } from './types'

export type SparkDirection = 'up' | 'down' | 'flat' | 'volatile'

export interface Sparkline {
  path: string
  direction: SparkDirection
}

const POINTS = 8
const WIDTH = 64
const HEIGHT = 24

function classify(values: number[]): SparkDirection {
  if (values.length < 2) return 'flat'
  const first = values[0]
  const last = values[values.length - 1]
  const range = Math.max(...values) - Math.min(...values)
  if (range === 0 || range / Math.max(first, 1e-9) < 0.03) return 'flat'

  let signFlips = 0
  for (let i = 1; i < values.length - 1; i++) {
    const prevDelta = values[i] - values[i - 1]
    const nextDelta = values[i + 1] - values[i]
    if (prevDelta !== 0 && nextDelta !== 0 && Math.sign(prevDelta) !== Math.sign(nextDelta)) {
      signFlips++
    }
  }
  if (signFlips >= Math.floor(values.length / 3)) return 'volatile'
  return last > first ? 'up' : 'down'
}

function toPath(values: number[]): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = WIDTH / (values.length - 1 || 1)
  return values
    .map((v, i) => {
      const x = Math.round(i * step)
      const y = Math.round(HEIGHT - 2 - ((v - min) / range) * (HEIGHT - 4))
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
}

/** Last-N-day token_share sparkline per model, built once from the full
 * history rollup. Models with fewer than 2 history points are omitted —
 * callers should fall back to a flat placeholder. */
export function buildSparklines(rows: RankingsHistoryRow[]): Map<string, Sparkline> {
  const byModel = new Map<string, RankingsHistoryRow[]>()
  for (const row of rows) {
    const list = byModel.get(row.model)
    if (list) list.push(row)
    else byModel.set(row.model, [row])
  }

  const result = new Map<string, Sparkline>()
  for (const [model, history] of byModel) {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
    const tail = sorted.slice(-POINTS)
    if (tail.length < 2) continue
    const values = tail.map((r) => r.token_share)
    result.set(model, { path: toPath(values), direction: classify(values) })
  }
  return result
}
