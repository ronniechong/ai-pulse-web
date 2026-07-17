import { useMemo, useState } from 'react'
import { useDashboardData } from '@/lib/DashboardDataContext'
import { useFormatters } from '@/lib/useFormatters'
import { Button } from '@/components/ui/button'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { trackEvent } from '@/lib/analytics'

type Mode = 'adoption' | 'downloads'

/** "release_2026_06_26" -> "2026-06-26" for FormatJS date formatting. */
function releaseToIso(release: string): string {
  return release.replace('release_', '').replaceAll('_', '-')
}

export function GeoPanel() {
  const { geoRegions, geoAdoption, geoRegionsLoading: loading } = useDashboardData()
  const { pct, compact, date } = useFormatters()
  const [mode, setMode] = useState<Mode>('adoption')

  const regions = geoRegions?.regions[mode] ?? []
  const max = Math.max(1, ...regions.map((r) => r.value))

  const topCountries = useMemo(() => {
    if (!geoAdoption) return []
    return [...geoAdoption.countries].sort((a, b) => b.usage_pct - a.usage_pct).slice(0, 10)
  }, [geoAdoption])

  if (loading && regions.length === 0) return <PanelSkeleton height={160} />

  return (
    <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-sans text-[13px] font-semibold text-[var(--pulse-text)]">Adoption by region</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === 'adoption' ? 'default' : 'outline'}
            className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
            onClick={() => {
              setMode('adoption')
              trackEvent('geo-mode-adoption')
            }}
          >
            Adoption index
          </Button>
          <Button
            size="sm"
            variant={mode === 'downloads' ? 'default' : 'outline'}
            className="h-auto rounded px-2.5 py-1 font-mono text-[11px]"
            onClick={() => {
              setMode('downloads')
              trackEvent('geo-mode-downloads')
            }}
          >
            SDK downloads
          </Button>
        </div>
      </div>

      {regions.length === 0 ? (
        <div className="flex h-[160px] items-center justify-center font-sans text-[13px] text-[var(--pulse-faint)]">
          No region data yet.
        </div>
      ) : (
        <div className="hidden grid-cols-4 gap-3 py-2.5 sm:grid">
          {regions.map((r) => {
            const intensity = 0.15 + 0.55 * (r.value / max)
            const size = 34 + (r.value / max) * 46
            return (
              <div key={r.region} className="flex flex-col items-center gap-1.5">
                <div
                  className="mx-auto flex items-center justify-center rounded-full border font-mono text-xs font-semibold"
                  style={{
                    width: size,
                    height: size,
                    background: `oklch(68% 0.16 248 / ${intensity.toFixed(2)})`,
                    borderColor: 'var(--pulse-accent)',
                    color: 'var(--pulse-text)',
                  }}
                >
                  {mode === 'adoption' ? pct(r.value / 100, 0) : compact(r.value)}
                </div>
                <div className="text-center font-sans text-[10.5px] text-[var(--pulse-muted)]">{r.region}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile fallback: top-10 country list — the region bubble grid needs
          more horizontal room than a phone screen affords. */}
      <div className="sm:hidden">
        {topCountries.map((c) => (
          <div
            key={c.country_code}
            className="flex justify-between border-b border-[var(--pulse-border)] py-1.5 font-sans text-[12px] text-[var(--pulse-text)]"
          >
            <span>{c.country_code}</span>
            <span className="font-mono text-[var(--pulse-muted)]">{pct(c.usage_pct / 100, 2)}</span>
          </div>
        ))}
      </div>

      {mode === 'adoption' && geoAdoption && (
        <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
          Claude usage only, not AI adoption broadly — Anthropic Economic Index, AEI{' '}
          {date(releaseToIso(geoAdoption.release))} release · static between quarterly releases
        </div>
      )}
      {mode === 'downloads' && (
        <div className="mt-2 font-mono text-[10.5px] text-[var(--pulse-faint)]">
          PyPI SDK installs (anthropic, openai, google-generativeai, ollama, mistralai) via ClickPy · updates daily
        </div>
      )}
      {regions.length > 0 && (
        <div className="mt-1 font-mono text-[10.5px] text-[var(--pulse-faint)]">
          These 8 regions don&apos;t cover the whole world — there&apos;s no Oceania/Pacific bucket, so Australia,
          NZ, and similar codes are excluded here rather than folded into a nearby region.
        </div>
      )}
    </div>
  )
}
