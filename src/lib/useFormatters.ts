import { useIntl } from 'react-intl'

/** All locale-sensitive formatting (numbers, percents, dates, relative
 * time) goes through FormatJS via this hook — no hand-rolled Intl calls or
 * manual "X hours ago" string-building elsewhere in the app. */
export function useFormatters() {
  const intl = useIntl()

  function pct(value: number, digits = 1): string {
    return intl.formatNumber(value, { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  function deltaPct(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined || value === 0) return '—'
    return (
      intl.formatNumber(value, {
        style: 'percent',
        signDisplay: 'exceptZero',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }) + 'pp'
    )
  }

  /** Signed relative change (e.g. "+8.4%", "-16.0%") — unlike deltaPct,
   * no "pp" suffix, because this is a ratio/relative change (this day's
   * avg vs. the overall avg), not a percentage-POINT difference between
   * two percentages. */
  function relativePct(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined) return '—'
    return intl.formatNumber(value, {
      style: 'percent',
      signDisplay: 'exceptZero',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }

  function deltaRank(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) return '—'
    return intl.formatNumber(value, { signDisplay: 'exceptZero' })
  }

  function compact(value: number): string {
    return intl.formatNumber(value, { notation: 'compact' })
  }

  /** Exact count with locale grouping (e.g. "1,234,567") — for tooltips
   * where the abbreviated `compact()` form would lose precision. */
  function wholeNumber(value: number): string {
    return intl.formatNumber(value, { maximumFractionDigits: 0 })
  }

  /** Plain decimal, no % — for indices like HHI that aren't percentages. */
  function decimal(value: number, digits = 2): string {
    return intl.formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  /** USD, e.g. "$0.07" — month-to-date spend is small enough that 2dp
   * (rather than a compact/rounded form) is the more honest display. */
  function currency(value: number, digits = 2): string {
    return intl.formatNumber(value, { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  /** Milliseconds -> seconds, e.g. "4.3s" — LLM call latency is always in
   * the single-digit-seconds range, never worth showing in raw ms. */
  function seconds(ms: number, digits = 1): string {
    return `${intl.formatNumber(ms / 1000, { minimumFractionDigits: digits, maximumFractionDigits: digits })}s`
  }

  function decimalDelta(value: number | null | undefined, digits = 2): string {
    if (value === null || value === undefined || value === 0) return '—'
    return intl.formatNumber(value, { signDisplay: 'exceptZero', minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  function date(iso: string): string {
    return intl.formatDate(iso, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }

  /** Absolute date + time in the viewer's own local timezone (no forced
   * timeZone override) — for tooltips that need the precise moment behind
   * a relative-time label like "3 hours ago". */
  function dateTime(iso: string): string {
    return intl.formatDate(iso, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  }

  function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffHours = Math.round(diffMs / 3_600_000)
    if (diffHours < 1) return intl.formatRelativeTime(0, 'second', { numeric: 'auto' })
    if (diffHours < 24) return intl.formatRelativeTime(-diffHours, 'hour', { numeric: 'auto' })
    return intl.formatRelativeTime(-Math.round(diffHours / 24), 'day', { numeric: 'auto' })
  }

  return {
    pct,
    deltaPct,
    relativePct,
    deltaRank,
    compact,
    wholeNumber,
    decimal,
    decimalDelta,
    currency,
    seconds,
    date,
    dateTime,
    relativeTime,
  }
}
