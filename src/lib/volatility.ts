import type { RankingsHistoryRow } from './types'

export interface ModelVolatility {
  model: string
  stdev: number
  minRank: number
  maxRank: number
  days: number
}

const MIN_DAYS = 30

/** Population stdev of a model's daily rank across its full available
 * history — how much it bounces around the leaderboard, not just its
 * current 1d/7d/30d delta. Requires MIN_DAYS+ observations so a model with
 * only a few days of history (e.g. a new entrant swinging from #51 to #12
 * on day 2) doesn't dominate the list on noise alone. */
export function computeRankVolatility(rows: RankingsHistoryRow[]): ModelVolatility[] {
  const byModel = new Map<string, number[]>()
  for (const row of rows) {
    if (row.model === 'other') continue
    const list = byModel.get(row.model)
    if (list) list.push(row.rank)
    else byModel.set(row.model, [row.rank])
  }

  const result: ModelVolatility[] = []
  for (const [model, ranks] of byModel) {
    if (ranks.length < MIN_DAYS) continue
    const mean = ranks.reduce((a, b) => a + b, 0) / ranks.length
    const variance = ranks.reduce((a, b) => a + (b - mean) ** 2, 0) / ranks.length
    result.push({
      model,
      stdev: Math.sqrt(variance),
      minRank: Math.min(...ranks),
      maxRank: Math.max(...ranks),
      days: ranks.length,
    })
  }
  return result.sort((a, b) => b.stdev - a.stdev)
}
