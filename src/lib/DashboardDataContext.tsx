import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { DATA_BASE, MANIFEST_URL, POLL_INTERVAL_MS, fetchJson } from './api'
import type {
  AppsData,
  CommentaryData,
  FactsData,
  GeoAdoptionData,
  GeoRegionsData,
  HFTrendingData,
  ManifestData,
  OccupationsData,
  RankingsData,
  RankingsHistoryData,
  SdkGeoData,
  SdkGeoTrendData,
} from './types'

interface DashboardData {
  manifest: ManifestData | null
  rankings: RankingsData | null
  rankingsHistory: RankingsHistoryData | null
  apps: AppsData | null
  hfTrending: HFTrendingData | null
  sdkGeo: SdkGeoData | null
  sdkGeoTrend: SdkGeoTrendData | null
  geoAdoption: GeoAdoptionData | null
  geoRegions: GeoRegionsData | null
  occupations: OccupationsData | null
  facts: FactsData | null
  commentary: CommentaryData | null
  loading: boolean
  error: string | null
}

const DashboardDataCtx = createContext<DashboardData | null>(null)

/** One source failing (404 while a section hasn't published yet, a
 * transient network blip) must never blank the rest of the dashboard —
 * same "a failure in one source never blocks the others" philosophy as
 * the pipeline itself. Each fetch is independent; a rejected one just
 * keeps that field null, and the panel that reads it renders its own
 * empty state. */
async function loadOptional<T>(url: string): Promise<T | null> {
  try {
    return await fetchJson<T>(url)
  } catch {
    return null
  }
}

async function loadAll(): Promise<Omit<DashboardData, 'loading' | 'error'>> {
  const [
    manifest,
    rankings,
    rankingsHistory,
    apps,
    hfTrending,
    sdkGeo,
    sdkGeoTrend,
    geoAdoption,
    geoRegions,
    occupations,
    facts,
    commentary,
  ] = await Promise.all([
    fetchJson<ManifestData>(MANIFEST_URL),
    loadOptional<RankingsData>(`${DATA_BASE}/rankings.json`),
    loadOptional<RankingsHistoryData>(`${DATA_BASE}/rankings-history.json`),
    loadOptional<AppsData>(`${DATA_BASE}/apps.json`),
    loadOptional<HFTrendingData>(`${DATA_BASE}/hf-trending.json`),
    loadOptional<SdkGeoData>(`${DATA_BASE}/sdk-geo.json`),
    loadOptional<SdkGeoTrendData>(`${DATA_BASE}/sdk-geo-trend.json`),
    loadOptional<GeoAdoptionData>(`${DATA_BASE}/geo-adoption.json`),
    loadOptional<GeoRegionsData>(`${DATA_BASE}/geo-regions.json`),
    loadOptional<OccupationsData>(`${DATA_BASE}/occupations.json`),
    loadOptional<FactsData>(`${DATA_BASE}/facts.json`),
    loadOptional<CommentaryData>(`${DATA_BASE}/commentary.json`),
  ])
  return {
    manifest,
    rankings,
    rankingsHistory,
    apps,
    hfTrending,
    sdkGeo,
    sdkGeoTrend,
    geoAdoption,
    geoRegions,
    occupations,
    facts,
    commentary,
  }
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardData>({
    manifest: null,
    rankings: null,
    rankingsHistory: null,
    apps: null,
    hfTrending: null,
    sdkGeo: null,
    sdkGeoTrend: null,
    geoAdoption: null,
    geoRegions: null,
    occupations: null,
    facts: null,
    commentary: null,
    loading: true,
    error: null,
  })
  const dataVersionRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function refresh(showLoading: boolean) {
      try {
        const manifest = await fetchJson<ManifestData>(MANIFEST_URL)
        if (manifest.data_version === dataVersionRef.current) return // silent no-op, data unchanged
        if (cancelled) return
        if (showLoading) setState((s) => ({ ...s, loading: true, error: null }))
        const all = await loadAll()
        if (cancelled) return
        dataVersionRef.current = all.manifest?.data_version ?? null
        setState({ ...all, loading: false, error: null })
      } catch (e) {
        if (cancelled) return
        setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : String(e) }))
      }
    }

    refresh(true)
    const interval = setInterval(() => refresh(false), POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh(false)
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return <DashboardDataCtx.Provider value={state}>{children}</DashboardDataCtx.Provider>
}

export function useDashboardData(): DashboardData {
  const ctx = useContext(DashboardDataCtx)
  if (!ctx) throw new Error('useDashboardData must be used within DashboardDataProvider')
  return ctx
}
