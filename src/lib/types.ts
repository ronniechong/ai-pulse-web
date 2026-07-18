// Mirrors the real JSON shapes published by ai-pulse-data (data/latest/*.json).
// Keep in sync with src/aipulse/{transform,facts,commentary,geo_regions}.py
// and scripts/ingest_occupations.py in that repo — the repo is the data
// contract, this file just types it for the client.

export interface RankingModel {
  rank: number
  model: string
  total_tokens: number
  token_share: number
}

export interface RankingsData {
  generated_at: string
  date: string
  source: string
  models: RankingModel[]
}

export interface AppRow {
  rank: number
  app_id: number
  app_name: string
  total_tokens: number
  total_requests: number
  categories: string[]
}

export interface AppsData {
  generated_at: string
  source: string
  apps: AppRow[]
}

export interface HFModel {
  rank: number
  id: string
  author: string | null
  downloads: number
  downloads_all_time: number | null
  likes: number
  trending_score: number
  pipeline_tag: string | null
  library_name: string | null
}

export interface HFTrendingData {
  generated_at: string
  source: string
  models: HFModel[]
}

export interface SdkGeoCountry {
  country_code: string
  downloads: number
}

export interface SdkGeoData {
  generated_at: string
  source: string
  window_days: number
  packages: Record<string, { provider: string; countries: SdkGeoCountry[] }>
}

export interface GeoAdoptionCountry {
  country_code: string
  usage_pct: number
  usage_per_capita_index: number
}

export interface GeoAdoptionData {
  generated_at: string
  source: string
  release: string
  period: { start: string; end: string }
  countries: GeoAdoptionCountry[]
}

export interface GeoRegionValue {
  region: string
  value: number
}

export interface GeoRegionsData {
  generated_at: string
  source: string
  regions: {
    adoption: GeoRegionValue[]
    downloads: GeoRegionValue[]
  }
}

export interface SdkGeoTrendPoint {
  date: string
  region: string
  package: string
  provider: string
  downloads: number
}

export interface SdkGeoTrendData {
  generated_at: string
  source: string
  regions: string[]
  packages: string[]
  series: SdkGeoTrendPoint[]
}

export interface Occupation {
  name: string
  soc_code: string
  usage_pct?: number
  automation_pct?: number
  augmentation_pct?: number
}

export interface OccupationsData {
  generated_at: string
  source: string
  release: string
  period: { start: string; end: string }
  occupations: Occupation[]
}

export interface Mover {
  model: string
  provider: string
  rank_today: number
  token_share_today: number
  rank_delta_1d: number | null
  token_share_delta_1d: number | null
  rank_delta_7d: number | null
  token_share_delta_7d: number | null
  rank_delta_30d: number | null
  token_share_delta_30d: number | null
}

export interface NewEntrant {
  model: string
  provider: string
  rank: number
  token_share: number
}

export interface Dropout {
  model: string
  provider: string
  last_rank: number
  last_token_share: number
}

export interface RecordFact {
  type: 'all_time_token_share' | 'first_time_rank1'
  model: string
  provider: string
  value: number
}

export interface ProviderShare {
  provider: string
  token_share_today: number
  delta_1d: number | null
  delta_7d: number | null
  delta_30d: number | null
}

export interface Concentration {
  hhi_today: number | null
  hhi_delta_30d: number | null
}

export interface FactsData {
  date: string
  generated_at: string
  rankings: {
    movers: Mover[]
    new_entrants: NewEntrant[]
    dropouts: Dropout[]
    records: RecordFact[]
    provider_share: ProviderShare[]
    concentration: Concentration
  }
}

export interface CommentaryData {
  headline: string
  summary: string
  highlights: string[]
  tone: 'quiet' | 'notable' | 'big_day'
}

export interface RankingsHistoryRow {
  date: string
  model: string
  rank: number
  token_share: number
  source: 'backfill' | 'pipeline'
}

export interface RankingsHistoryData {
  generated_at: string
  rows: RankingsHistoryRow[]
}

export interface RankingsDailyTotalRow {
  date: string
  total_tokens: number
  source: 'backfill' | 'pipeline'
}

export interface RankingsDailyTotalsData {
  generated_at: string
  rows: RankingsDailyTotalRow[]
}

export type SourceStatus = 'ok' | 'degraded' | 'skipped'

export interface ManifestSource {
  status: SourceStatus
  last_success: string | null
  path: string
  error?: string
}

export interface ManifestData {
  generated_at: string
  data_version: string
  schema_version: number
  sources: Record<string, ManifestSource>
}
