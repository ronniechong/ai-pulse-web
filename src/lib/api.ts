// Runtime data-fetching layer: manifest poll + visibilitychange re-check,
// silent hot-swap of state (see work-docs/ai-pulse.md architecture summary).
// Data is fetched straight from the public ai-pulse-data repo on GitHub —
// no backend, no rebuild on data change.

const REPO_BASE = 'https://raw.githubusercontent.com/ronniechong/ai-pulse-data/main'
export const DATA_BASE = `${REPO_BASE}/data/latest`
export const MANIFEST_URL = `${REPO_BASE}/data/manifest.json`

export const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 min — matches the daily-cron cadence with margin

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`fetch failed: ${url} (${res.status})`)
  }
  return res.json() as Promise<T>
}
