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

  function deltaRank(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) return '—'
    return intl.formatNumber(value, { signDisplay: 'exceptZero' })
  }

  function compact(value: number): string {
    return intl.formatNumber(value, { notation: 'compact' })
  }

  /** Plain decimal, no % — for indices like HHI that aren't percentages. */
  function decimal(value: number, digits = 2): string {
    return intl.formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  function decimalDelta(value: number | null | undefined, digits = 2): string {
    if (value === null || value === undefined || value === 0) return '—'
    return intl.formatNumber(value, { signDisplay: 'exceptZero', minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  function date(iso: string): string {
    return intl.formatDate(iso, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }

  function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffHours = Math.round(diffMs / 3_600_000)
    if (diffHours < 1) return intl.formatRelativeTime(0, 'second', { numeric: 'auto' })
    if (diffHours < 24) return intl.formatRelativeTime(-diffHours, 'hour', { numeric: 'auto' })
    return intl.formatRelativeTime(-Math.round(diffHours / 24), 'day', { numeric: 'auto' })
  }

  return { pct, deltaPct, deltaRank, compact, decimal, decimalDelta, date, relativeTime }
}
