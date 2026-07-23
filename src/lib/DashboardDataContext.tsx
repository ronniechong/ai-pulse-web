import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { DATA_BASE, MANIFEST_URL, POLL_INTERVAL_MS, fetchJson } from './api'
import type {
  AiTransparencyData,
  AppsData,
  CommentaryData,
  FactsData,
  GeoAdoptionData,
  GeoRegionsData,
  HFTrendingData,
  ManifestData,
  OccupationsData,
  RankingsData,
  RankingsDailyTotalsData,
  RankingsHistoryData,
  SdkGeoData,
  SdkGeoTrendData,
} from './types'

interface DashboardData {
  manifest: ManifestData | null
  rankings: RankingsData | null
  rankingsLoading: boolean
  rankingsHistory: RankingsHistoryData | null
  rankingsHistoryLoading: boolean
  rankingsDailyTotals: RankingsDailyTotalsData | null
  rankingsDailyTotalsLoading: boolean
  apps: AppsData | null
  appsLoading: boolean
  hfTrending: HFTrendingData | null
  hfTrendingLoading: boolean
  sdkGeo: SdkGeoData | null
  sdkGeoLoading: boolean
  sdkGeoTrend: SdkGeoTrendData | null
  sdkGeoTrendLoading: boolean
  geoAdoption: GeoAdoptionData | null
  geoAdoptionLoading: boolean
  geoRegions: GeoRegionsData | null
  geoRegionsLoading: boolean
  occupations: OccupationsData | null
  occupationsLoading: boolean
  facts: FactsData | null
  factsLoading: boolean
  commentary: CommentaryData | null
  commentaryLoading: boolean
  aiTransparency: AiTransparencyData | null
  aiTransparencyLoading: boolean
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

const INITIAL_STATE: DashboardData = {
  manifest: null,
  rankings: null,
  rankingsLoading: true,
  rankingsHistory: null,
  rankingsHistoryLoading: true,
  rankingsDailyTotals: null,
  rankingsDailyTotalsLoading: true,
  apps: null,
  appsLoading: true,
  hfTrending: null,
  hfTrendingLoading: true,
  sdkGeo: null,
  sdkGeoLoading: true,
  sdkGeoTrend: null,
  sdkGeoTrendLoading: true,
  geoAdoption: null,
  geoAdoptionLoading: true,
  geoRegions: null,
  geoRegionsLoading: true,
  occupations: null,
  occupationsLoading: true,
  facts: null,
  factsLoading: true,
  commentary: null,
  commentaryLoading: true,
  aiTransparency: null,
  aiTransparencyLoading: true,
  error: null,
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardData>(INITIAL_STATE)
  const dataVersionRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Every source is fetched and merged into state independently — no
    // Promise.all. A slow or unusually large source (e.g. sdk-geo-trend.json,
    // ~2.8MB and growing) must never hold up any other panel's loading
    // state; each panel reads only its own `<source>Loading` flag.
    function loadSource<T>(url: string, onDone: (data: T | null) => void) {
      loadOptional<T>(url).then((data) => {
        if (!cancelled) onDone(data)
      })
    }

    async function refresh(showLoading: boolean) {
      try {
        const manifest = await fetchJson<ManifestData>(MANIFEST_URL)
        if (manifest.data_version === dataVersionRef.current) return // silent no-op, data unchanged
        if (cancelled) return
        dataVersionRef.current = manifest.data_version

        setState((s) => ({
          ...s,
          manifest,
          error: null,
          ...(showLoading && {
            rankingsLoading: true,
            rankingsHistoryLoading: true,
            rankingsDailyTotalsLoading: true,
            appsLoading: true,
            hfTrendingLoading: true,
            sdkGeoLoading: true,
            sdkGeoTrendLoading: true,
            geoAdoptionLoading: true,
            geoRegionsLoading: true,
            occupationsLoading: true,
            factsLoading: true,
            commentaryLoading: true,
            aiTransparencyLoading: true,
          }),
        }))

        loadSource<RankingsData>(`${DATA_BASE}/rankings.json`, (rankings) =>
          setState((s) => ({ ...s, rankings, rankingsLoading: false })),
        )
        loadSource<RankingsHistoryData>(`${DATA_BASE}/rankings-history.json`, (rankingsHistory) =>
          setState((s) => ({ ...s, rankingsHistory, rankingsHistoryLoading: false })),
        )
        loadSource<RankingsDailyTotalsData>(`${DATA_BASE}/rankings-totals-history.json`, (rankingsDailyTotals) =>
          setState((s) => ({ ...s, rankingsDailyTotals, rankingsDailyTotalsLoading: false })),
        )
        loadSource<AppsData>(`${DATA_BASE}/apps.json`, (apps) => setState((s) => ({ ...s, apps, appsLoading: false })))
        loadSource<HFTrendingData>(`${DATA_BASE}/hf-trending.json`, (hfTrending) =>
          setState((s) => ({ ...s, hfTrending, hfTrendingLoading: false })),
        )
        loadSource<SdkGeoData>(`${DATA_BASE}/sdk-geo.json`, (sdkGeo) => setState((s) => ({ ...s, sdkGeo, sdkGeoLoading: false })))
        loadSource<SdkGeoTrendData>(`${DATA_BASE}/sdk-geo-trend.json`, (sdkGeoTrend) =>
          setState((s) => ({ ...s, sdkGeoTrend, sdkGeoTrendLoading: false })),
        )
        loadSource<GeoAdoptionData>(`${DATA_BASE}/geo-adoption.json`, (geoAdoption) =>
          setState((s) => ({ ...s, geoAdoption, geoAdoptionLoading: false })),
        )
        loadSource<GeoRegionsData>(`${DATA_BASE}/geo-regions.json`, (geoRegions) =>
          setState((s) => ({ ...s, geoRegions, geoRegionsLoading: false })),
        )
        loadSource<OccupationsData>(`${DATA_BASE}/occupations.json`, (occupations) =>
          setState((s) => ({ ...s, occupations, occupationsLoading: false })),
        )
        loadSource<FactsData>(`${DATA_BASE}/facts.json`, (facts) => setState((s) => ({ ...s, facts, factsLoading: false })))
        loadSource<CommentaryData>(`${DATA_BASE}/commentary.json`, (commentary) =>
          setState((s) => ({ ...s, commentary, commentaryLoading: false })),
        )
        loadSource<AiTransparencyData>(`${DATA_BASE}/ai-transparency.json`, (aiTransparency) =>
          setState((s) => ({ ...s, aiTransparency, aiTransparencyLoading: false })),
        )
      } catch (e) {
        if (cancelled) return
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }))
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
