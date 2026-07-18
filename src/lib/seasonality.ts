import type { RankingsDailyTotalRow } from './types'

export interface DayOfWeekVolume {
  dow: number // 0=Sun .. 6=Sat, matches JS Date#getDay()
  avgTotalTokens: number
  deltaVsOverall: number // fraction, e.g. 0.084 for +8.4%
  days: number
}

/** Naive day-of-week average of daily total token volume — NOT detrended
 * against the platform's own overall growth over the tracked period (total
 * volume grew roughly 180x from 2025-01-01 to today), so a day-of-week
 * with more samples from the high-volume tail would skew high independent
 * of any real weekday effect. Each weekday gets ~80 evenly-spread samples
 * across the full window, which limits how much that can bias the result,
 * but this is a documented simplification, not a seasonally-adjusted
 * figure — see the panel's own caveat text. */
export function computeDayOfWeekVolume(rows: RankingsDailyTotalRow[]): DayOfWeekVolume[] {
  const byDow = new Map<number, number[]>()
  for (const row of rows) {
    const dow = new Date(`${row.date}T00:00:00Z`).getUTCDay()
    const list = byDow.get(dow)
    if (list) list.push(row.total_tokens)
    else byDow.set(dow, [row.total_tokens])
  }

  const overallAvg = rows.reduce((sum, r) => sum + r.total_tokens, 0) / Math.max(1, rows.length)

  const result: DayOfWeekVolume[] = []
  for (let dow = 0; dow < 7; dow++) {
    const values = byDow.get(dow) ?? []
    if (values.length === 0) continue
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    result.push({ dow, avgTotalTokens: avg, deltaVsOverall: overallAvg > 0 ? avg / overallAvg - 1 : 0, days: values.length })
  }
  return result
}
