# Metrics

Every panel on the dashboard, what it's actually measuring, where the number
comes from, and what it does and doesn't tell you. Field names refer to
`src/lib/types.ts`, which mirrors the real JSON published by `ai-pulse-data`
(the repo is the data contract — this file documents it, it doesn't redefine
it).

## Rankings leaderboard + sparklines

**Definition:** OpenRouter's top-50 models by total token volume routed
through the platform, plus an aggregate `"other"` row for everything outside
the top 50. Sparklines plot each model's token-share trend over its recent
history.

**Source:** `rankings.json` (`RankingsData.models[]`, fields `rank`,
`model`, `total_tokens`, `token_share`) for the current day; sparklines read
`rankings-history.json` (`RankingsHistoryData.rows[]`).

**Grain:** One row per model per day. No visibility below rank 50.

**Caveats:** Token counts come from each provider's own tokenizer — not
directly comparable model-to-model. OpenRouter is one (large) routing
platform, not the whole AI market — selection bias toward API developers,
not end consumers.

## Provider share (treemap) + concentration (HHI)

**Definition:** Same day's token volume grouped by provider (`anthropic`,
`openai`, etc.) instead of by model. The HHI chip is the
Herfindahl-Hirschman Index — `Σ(provider_share²)` — a standard market
concentration measure; higher means fewer providers dominate.

**Source:** `facts.json` → `FactsData.rankings.provider_share[]` (treemap)
and `FactsData.rankings.concentration` → `{hhi_today, hhi_delta_30d}`.

**Grain:** One row per provider per day; HHI is a single daily scalar plus a
30-day-ago comparison.

**Caveats:** The `"other"` aggregate bucket (~40+ small/unmapped providers)
is excluded from both the treemap's leaderboard framing and the HHI
calculation — including it as a single entity would misrepresent it as one
concentrated actor when it's actually the long tail. Provider identity comes
from a hand-maintained mapping table (`providers.py` in `ai-pulse-data`);
unmapped prefixes fail open (raw prefix shown, logged for manual curation),
so a brand-new provider may briefly appear under its raw slug.

**Momentum (added 2026-07-18):** a Δ1d/Δ7d/Δ30d toggle switches which of
`provider_share[].delta_1d/7d/30d` (already computed, previously unused)
appears in the tooltip, color-coded (green positive, red negative). Not a
tile-level encoding — tiles are already tight on room for name + share%,
and small tiles hide their label entirely, so both the delta figure and
its color live only in the tooltip regardless of tile size.

## Rankings over time (racing bar)

**Definition:** Top 8 models by token share, animated across every day of
available history.

**Source:** `rankings-history.json` (`RankingsHistoryData.rows[]`, fields
`date`, `model`, `rank`, `token_share`, `source`).

**Grain:** One row per model per day. History before the pipeline's live
start date (2026-07-15) is backfilled from OpenRouter's historical dataset
API back to its earliest available date (2025-01-01) — each row's `source`
field (`"backfill"` or `"pipeline"`) records which. No retro-generated
commentary exists for backfilled days.

**Caveats:** "New entrant" framing elsewhere on the dashboard means
"newly in the top 50," not "newly released" — OpenRouter's API has no
visibility below rank 50, so an older model re-entering the top 50 looks
identical to a genuinely new one.

## Most volatile rankings (added 2026-07-18)

**Definition:** Population standard deviation of a model's daily rank
across its full available history — how much it bounces around the
leaderboard over time, not just a recent 1d/7d/30d move. Top 8 by
stdev, each row also shows the actual min–max rank range it has spanned.

**Source:** Computed entirely client-side from `rankings-history.json`
(same file `RacingBar` already fetches in full — no new backend data or
pipeline step needed for this panel).

**Grain:** One score per model, computed over its entire history in the
rollup (2025-01-01 onward where backfilled).

**Caveats:** Requires 30+ tracked days of history to appear, so a
brand-new entrant swinging from #51 to #12 on day 2 doesn't dominate the
list on a couple of noisy data points — this intentionally favors
established models with a real track record of movement over noisy new
ones. The `"other"` aggregate row is excluded (not a real model).

## Usage by day of week (added 2026-07-18)

**Definition:** Average total daily token volume (summed across every
tracked model, including `"other"`) by day of week — is usage actually
lower on weekends, higher on weekdays?

**Source:** `rankings-totals-history.json` (`RankingsDailyTotalsData.rows[]`,
fields `date`, `total_tokens`, `source`). A new small rollup, not the same
file `rankings-history.json`/`RacingBar` use — that file only stores each
model's normalized `token_share` (relative within each day), which
mathematically cancels out any real change in the day's absolute volume
(live-checked first: weekday/weekend on token_share alone was flat,
~17-18% every day, no real signal — confirming the normalized field
genuinely can't answer this question). `rankings-totals-history.json`
instead sums the same raw `total_tokens` the pipeline already fetches
per-model each day (before it gets divided down into `token_share`) —
no new API calls, just kept instead of discarded. Backfilled to
2025-01-01 the same way `rankings-history.json` was (M2.5), then extended
daily from the same window fetch `run_rankings_history_rollup` already
makes.

**Grain:** One row per day (not per model) — stays tiny (~560 rows, tens
of KB) even over 18 months of history.

**Caveats:** This is a naive day-of-week average, **not detrended**
against the platform's own growth over the tracked window (total daily
volume grew roughly 180x from 2025-01-01 to today). Each weekday gets
~80 samples spread evenly across that whole window, which limits how much
growth alone can bias the result, but this is a documented simplification,
not a seasonally-adjusted figure. Live-checked against real data
(2026-07-18): weekdays run +2% to +8% above the overall average, weekends
run -13% to -16% below — directionally consistent with this dashboard's
existing "OpenRouter selection bias toward API developers, not end
consumers" caveat.

## Where & who — adoption / SDK-downloads toggle

**Definition:** Two different signals bucketed into the same 8 world
regions: Anthropic Economic Index usage-adoption index, or PyPI SDK download
counts (installs of `anthropic`/`openai`/`google-generativeai`/`ollama`/
`mistralai`).

**Source:** `geo-regions.json` (`GeoRegionsData.regions.adoption[]` /
`.regions.downloads[]`). Underlying per-country data: `geo-adoption.json`
(Economic Index, ISO alpha-3 codes) and `sdk-geo.json` (ClickPy/PyPI, ISO
alpha-2 codes) — cross-referenced through a hand-authored country→region
crosswalk (`regions.py` in `ai-pulse-data`).

**Grain:** 8 regions (North America, Europe, East Asia, South Asia, SE Asia,
Middle East, Latin America, Africa). Economic Index refreshes quarterly;
SDK downloads refresh daily (trailing window).

**Caveats:** PyPI install counts measure package installs, not inference
usage — CI/CD pipelines inflate this. Economic Index measures self-reported
Claude usage specifically, not AI usage generally. No Oceania/Pacific bucket
exists in this regional grouping — genuinely unclassifiable country codes
(e.g. `AUS`, `NZL`, regional aggregates like `EU`) are logged and skipped,
not force-mapped into a neighboring region.

## SDK downloads by region (trend chart)

**Definition:** Daily PyPI install counts per SDK package, summed into the
same 8 world regions as the adoption/SDK-downloads toggle above, plotted as
a line per region for one selected package at a time.

**Source:** `sdk-geo-trend.json` (`SdkGeoTrendData.series[]`). Derived from
`sdk-geo-history.json` (a cumulative rollup, not served to the client
directly — 56MB+ and growing) via the same country→region crosswalk
(`regions.py`) used by `geo-regions.json`. `sdk-geo-history.json` was
backfilled once (2025-01-01 onward) in M2.5 and extended daily starting
2026-07-18 — days before that date reflect the one-time backfill, not a
gap in daily collection.

**Grain:** 8 regions × 5 packages × 1 row/day. Daily.

**Caveats:** Same "installs, not usage" caveat as the toggle above. The
package selector shows one package's 8 region-lines at a time (not all 40
at once) to stay readable — region colors are a validated categorical
palette (see `tokens.ts` `REGION_COL`) whose worst adjacent pair sits in
the CVD "floor" band, which is why the panel always pairs color with the
legend + tooltip, never color alone.

## Occupations split

**Definition:** Top 20 occupations by AI usage share, each split into
"automation" (AI doing the task) vs. "augmentation" (AI assisting a human
doing the task).

**Source:** `occupations.json` (`OccupationsData.occupations[]`, fields
`name`, `soc_code`, `usage_pct`, `automation_pct`, `augmentation_pct`).

**Grain:** One row per occupation (detailed SOC title, not coarse major
group), refreshed on the same quarterly cadence as the Economic Index
release it's drawn from.

**Caveats:** Same Claude-specific-usage caveat as the geo-adoption panel —
this is Anthropic Economic Index data, not a market-wide occupation study.

## Apps leaderboard + category tabs

**Definition:** Top apps by token volume or request count routed through
OpenRouter, taggable by category (`coding`, `creative`, `productivity`,
`entertainment`) and the `cli-agent` subcategory.

**Source:** `apps.json` (`AppsData.apps[]`, fields `rank`, `app_id`,
`app_name`, `total_tokens`, `total_requests`, `categories[]`).

**Grain:** One row per app per day, top 50.

**Caveats:** `categories` is empty for most apps (only ~35/50 on a typical
day) — untagged apps only ever appear under "All," which is expected
behavior, not missing data. App-level and model-level rankings can't be
cross-tabbed — OpenRouter's public API has no "which model does this app
route to" endpoint, confirmed live during M1. `rank` in the raw data is
always OpenRouter's own tokens-based rank, shown in the tooltip as "Tokens
rank" regardless of which metric the Tokens/Requests toggle is currently
sorting by.

**Tokens-vs-requests divergence (added 2026-07-18):** a Tokens/Requests
toggle re-sorts the list client-side by the selected metric (not
`apps.json`'s own tokens-based `rank`) — switching can meaningfully
reorder the leaderboard, since a high-request/low-token app is many small
interactions (a chat UI) and a low-request/high-token app is few huge jobs
(a batch or agent integration). The tooltip always shows an approximate
avg tokens/request figure (`total_tokens ÷ total_requests`) as the
concrete "intensity" number behind that distinction.

## Hugging Face trending

**Definition:** Currently-trending open-weight models on the Hugging Face
Hub.

**Source:** `hf-trending.json` (`HFTrendingData.models[]`, fields `rank`,
`id`, `author`, `downloads`, `downloads_all_time`, `likes`,
`trending_score`, `pipeline_tag`, `library_name`).

**Grain:** Snapshot of HF's own rolling trending window — not backfillable
(HF's API only exposes the current trending state, no historical trending
snapshots), so this panel's history starts from the pipeline's real day one.

**Caveats:** Downloads measure open-weights pulls, not inference usage — a
heavily-downloaded model may be rarely run, and a model served entirely via
API (never downloaded) won't appear here at all.

**Task/library filter (added 2026-07-18):** a filter row (All + up to 4
task types) built dynamically from whichever `pipeline_tag` values
actually appear in today's top 50, most-frequent first — not a hardcoded
list, since HF's task taxonomy is open-ended (dozens of possible values)
unlike `apps.json`'s fixed OpenRouter category set. Each visible row also
shows its `pipeline_tag`/`library_name` (where HF reports them) as a small
caption under the model name. Complements the OpenRouter-centric panels
elsewhere on the dashboard, which are entirely chat/agent-model framed —
this surfaces the image/video/audio/embedding side of what's trending in
open weights.

## AI commentary (Today's Pulse)

**Definition:** A daily headline + summary narrating what changed, written
by an LLM from a pre-computed facts payload — never from raw data directly.

**Source:** `commentary.json` (`CommentaryData`: `headline`, `summary`,
`highlights[]`, `tone`). Generated from `facts.json`'s movers/entrants/
dropouts/records/provider-share numbers (`ai-pulse-data`'s `commentary.py`).

**Grain:** One commentary object per day.

**Caveats:** Every entity and number the LLM writes is validated against the
same facts payload before publishing; a mismatch triggers one retry, then a
deterministic template — so commentary is either LLM-written-and-verified or
template-only, never unverified. The `tone` badge (quiet / notable / big
day) is always rule-based on fact counts/magnitude, never the LLM's own
judgment.
