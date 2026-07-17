import { useEffect, useMemo, useRef, useState } from 'react'
import type { EChartsOption } from 'echarts'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useEcharts } from '@/hooks/useEcharts'
import { CHART_COL, FONT_MONO, FONT_SANS } from '@/lib/tokens'
import { formatModelName } from '@/lib/format'
import { useFormatters } from '@/lib/useFormatters'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'

interface Frame {
  date: string
  bars: { name: string; share: number }[]
}

const TOP_N = 8
const BASE_INTERVAL_MS = 220

function buildFrames(rows: { date: string; model: string; token_share: number }[]): Frame[] {
  const byDate = new Map<string, { model: string; token_share: number }[]>()
  for (const row of rows) {
    if (row.model === 'other') continue
    const list = byDate.get(row.date)
    if (list) list.push(row)
    else byDate.set(row.date, [row])
  }
  const dates = [...byDate.keys()].sort()
  return dates.map((date) => {
    const top = [...byDate.get(date)!].sort((a, b) => b.token_share - a.token_share).slice(0, TOP_N)
    return { date, bars: top.map((r) => ({ name: formatModelName(r.model), share: r.token_share })) }
  })
}

export function RacingBar() {
  const { rankingsHistory, rankingsHistoryLoading: loading } = useDashboardData()
  const { pct, date } = useFormatters()
  const frames = useMemo(() => (rankingsHistory ? buildFrames(rankingsHistory.rows) : []), [rankingsHistory])

  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // One "scrub used" event per drag session, not per pixel dragged.
  const scrubTracked = useRef(false)

  useEffect(() => {
    if (frames.length > 0) setIdx(frames.length - 1)
  }, [frames.length])

  useEffect(() => {
    if (!playing || frames.length === 0) return
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % frames.length)
    }, BASE_INTERVAL_MS / speed)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [playing, speed, frames.length])

  const frame = frames[idx]

  const option: EChartsOption = useMemo(() => {
    if (!frame) return {}
    const sorted = [...frame.bars].sort((a, b) => a.share - b.share)
    return {
      grid: { left: 140, right: 50, top: 10, bottom: 10 },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        data: sorted.map((b) => b.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: CHART_COL.text, fontFamily: FONT_SANS, fontSize: 12.5 },
      },
      animationDuration: BASE_INTERVAL_MS * 0.8,
      animationDurationUpdate: BASE_INTERVAL_MS * 0.8,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear',
      series: [
        {
          type: 'bar',
          data: sorted.map((b) => b.share),
          barWidth: 16,
          itemStyle: { color: CHART_COL.accent, borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            formatter: (p) => pct(Number(p.value)),
            color: CHART_COL.muted,
            fontFamily: FONT_MONO,
            fontSize: 12,
          },
        },
      ],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame])

  const showEmpty = !loading && frames.length === 0
  const ref = useEcharts(option, [frame], loading && frames.length === 0)

  return (
    <div className="rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Top 8 by token share</span>
        <span className="font-mono text-xs text-[var(--pulse-accent)]">{frame ? date(frame.date) : '—'}</span>
      </div>
      <div className="relative h-[280px] w-full">
        <div ref={ref} className="h-full w-full" />
        {showEmpty && (
          <div className="absolute inset-0 flex items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
            No history yet.
          </div>
        )}
      </div>
      {frames.length > 0 && (
        <div className="mt-3.5 flex items-center gap-3">
          <Button
            size="sm"
            className="h-auto rounded px-3 py-1.5 font-mono text-[11px]"
            variant={playing ? 'default' : 'outline'}
            onClick={() => {
              setPlaying((p) => !p)
              trackEvent(playing ? 'racing-bar-pause' : 'racing-bar-play')
            }}
          >
            {playing ? 'Pause' : 'Play'}
          </Button>
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={idx}
            onChange={(e) => {
              setPlaying(false)
              setIdx(Number(e.target.value))
              if (!scrubTracked.current) {
                scrubTracked.current = true
                trackEvent('racing-bar-scrub')
              }
            }}
            onPointerUp={() => {
              scrubTracked.current = false
            }}
            className="flex-1 accent-[var(--pulse-accent)]"
          />
          <div className="flex gap-1">
            {[1, 2, 4].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={speed === s ? 'default' : 'outline'}
                className="h-auto rounded px-2.5 py-1.5 font-mono text-[11px]"
                onClick={() => {
                  setSpeed(s)
                  trackEvent(`racing-bar-speed-${s}x`)
                }}
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
